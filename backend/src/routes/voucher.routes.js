const express = require('express');
const path = require('path');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { generateVoucherNumber } = require('../utils/voucherNumber');

const router = express.Router();
router.use(verifyToken); // every voucher route requires login

const relPath = (absPath) => absPath ? `/uploads/signatures/${path.basename(absPath)}` : null;

// ============================================================
// GET /api/vouchers  (list, with role-based scope + search/filter/sort)
// Employee -> only own vouchers
// Director / Accounts -> all vouchers
// Query params: search, status, department, category, dateFrom, dateTo,
//               amountMin, amountMax, sortBy, sortOrder
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { search, status, department, category, dateFrom, dateTo, amountMin, amountMax, sortBy, sortOrder } = req.query;

    const where = [];
    const params = [];

    if (req.user.role === 'employee') {
      where.push('employee_id = ?');
      params.push(req.user.id);
    }

    if (req.user.role === 'director' && req.query.pendingOnly === 'true') {
      where.push("status = 'pending_approval'");
    }

    if (search) {
      where.push('(voucher_number LIKE ? OR employee_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      where.push('status = ?');
      params.push(status);
    }
    if (department) {
      where.push('department_name = ?');
      params.push(department);
    }
    if (category) {
      where.push('expense_category = ?');
      params.push(category);
    }
    if (dateFrom) {
      where.push('expense_date >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      where.push('expense_date <= ?');
      params.push(dateTo);
    }
    if (amountMin) {
      where.push('amount >= ?');
      params.push(amountMin);
    }
    if (amountMax) {
      where.push('amount <= ?');
      params.push(amountMax);
    }

    const allowedSort = ['voucher_date', 'expense_date', 'amount', 'status', 'employee_name', 'created_at'];
    const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT * FROM vouchers ${whereClause} ORDER BY ${sortCol} ${sortDir}`,
      params
    );

    const data = rows.map(v => ({
      ...v,
      employee_signature_url: relPath(v.employee_signature_path),
      director_signature_url: relPath(v.director_signature_path)
    }));

    res.json({ vouchers: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch vouchers.' });
  }
});

// ============================================================
// GET /api/vouchers/:id  (details, with access check)
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Voucher not found.' });

    const voucher = rows[0];
    if (req.user.role === 'employee' && voucher.employee_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only view your own vouchers.' });
    }

    res.json({
      voucher: {
        ...voucher,
        employee_signature_url: relPath(voucher.employee_signature_path),
        director_signature_url: relPath(voucher.director_signature_path)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch voucher.' });
  }
});

// ============================================================
// POST /api/vouchers  (create - Draft by default; employee only)
// ============================================================
router.post('/', requireRole('employee'), async (req, res) => {
  try {
    const {
      voucher_date, expense_date, department_name, expense_title,
      expense_category, expense_description, amount
    } = req.body;

    // Validation rules from spec
    if (!department_name) return res.status(400).json({ message: 'Department is mandatory.' });
    if (!expense_title) return res.status(400).json({ message: 'Expense Title is mandatory.' });
    if (!expense_date) return res.status(400).json({ message: 'Expense Date is mandatory.' });
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ message: 'Amount is mandatory.' });
    }
    if (Number(amount) <= 0) return res.status(400).json({ message: 'Amount must be greater than zero.' });

    const voucherNumber = await generateVoucherNumber();
    const today = new Date().toISOString().slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO vouchers
        (voucher_number, voucher_date, expense_date, department_name, expense_title,
         expense_category, expense_description, amount, employee_id, employee_name,
         employee_code, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        voucherNumber, voucher_date || today, expense_date, department_name, expense_title,
        expense_category, expense_description, amount, req.user.id, req.user.name,
        req.user.employee_code || null
      ]
    );

    res.status(201).json({ message: 'Voucher saved as Draft.', voucherId: result.insertId, voucherNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create voucher.' });
  }
});

// ============================================================
// PUT /api/vouchers/:id  (edit - only own Draft vouchers, employee only)
// ============================================================
router.put('/:id', requireRole('employee'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Voucher not found.' });
    const voucher = rows[0];

    if (voucher.employee_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own vouchers.' });
    }
    if (voucher.status !== 'draft') {
      return res.status(400).json({ message: 'Only Draft vouchers can be edited.' });
    }

    const {
      voucher_date, expense_date, department_name, expense_title,
      expense_category, expense_description, amount
    } = req.body;

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero.' });
    }

    await pool.query(
      `UPDATE vouchers SET
        voucher_date = COALESCE(?, voucher_date),
        expense_date = COALESCE(?, expense_date),
        department_name = COALESCE(?, department_name),
        expense_title = COALESCE(?, expense_title),
        expense_category = COALESCE(?, expense_category),
        expense_description = COALESCE(?, expense_description),
        amount = COALESCE(?, amount)
       WHERE id = ?`,
      [voucher_date, expense_date, department_name, expense_title, expense_category, expense_description, amount, req.params.id]
    );

    res.json({ message: 'Voucher updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update voucher.' });
  }
});

// ============================================================
// DELETE /api/vouchers/:id  (only own Draft vouchers, employee only)
// ============================================================
router.delete('/:id', requireRole('employee'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Voucher not found.' });
    const voucher = rows[0];

    if (voucher.employee_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own vouchers.' });
    }
    if (voucher.status !== 'draft') {
      return res.status(400).json({ message: 'Only Draft vouchers can be deleted.' });
    }

    await pool.query('DELETE FROM vouchers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Voucher deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete voucher.' });
  }
});

// ============================================================
// POST /api/vouchers/:id/signature  (employee uploads signature image)
// ============================================================
router.post('/:id/signature', requireRole('employee'), upload.single('signature'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Voucher not found.' });
    const voucher = rows[0];

    if (voucher.employee_id !== req.user.id) return res.status(403).json({ message: 'Not your voucher.' });
    if (voucher.status !== 'draft') return res.status(400).json({ message: 'Signature can only be updated on a Draft voucher.' });
    if (!req.file) return res.status(400).json({ message: 'No signature image uploaded.' });

    await pool.query('UPDATE vouchers SET employee_signature_path = ? WHERE id = ?', [req.file.path, req.params.id]);
    res.json({ message: 'Signature uploaded.', signature_url: relPath(req.file.path) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to upload signature.' });
  }
});

// ============================================================
// POST /api/vouchers/:id/submit  (Draft -> Pending Approval; employee only)
// ============================================================
router.post('/:id/submit', requireRole('employee'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Voucher not found.' });
    const voucher = rows[0];

    if (voucher.employee_id !== req.user.id) return res.status(403).json({ message: 'Not your voucher.' });
    if (voucher.status !== 'draft') return res.status(400).json({ message: 'Only Draft vouchers can be submitted.' });
    if (!voucher.employee_signature_path) {
      return res.status(400).json({ message: 'Employee Signature is mandatory before submission.' });
    }

    await pool.query("UPDATE vouchers SET status = 'pending_approval' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Voucher submitted for approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit voucher.' });
  }
});

// ============================================================
// POST /api/vouchers/:id/approve  (director only; requires director signature)
// ============================================================
router.post('/:id/approve', requireRole('director'), upload.single('signature'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Voucher not found.' });
    const voucher = rows[0];

    if (voucher.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Only vouchers pending approval can be approved.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Director Signature is mandatory before approval.' });
    }

    await pool.query(
      `UPDATE vouchers SET status = 'approved', director_id = ?, director_signature_path = ?, approval_date = NOW()
       WHERE id = ?`,
      [req.user.id, req.file.path, req.params.id]
    );
    res.json({ message: 'Voucher approved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to approve voucher.' });
  }
});

// ============================================================
// POST /api/vouchers/:id/reject  (director only; requires rejection reason)
// ============================================================
router.post('/:id/reject', requireRole('director'), async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    if (!rejection_reason || !rejection_reason.trim()) {
      return res.status(400).json({ message: 'Rejection Reason is mandatory if a voucher is rejected.' });
    }

    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Voucher not found.' });
    const voucher = rows[0];

    if (voucher.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Only vouchers pending approval can be rejected.' });
    }

    await pool.query(
      `UPDATE vouchers SET status = 'rejected', director_id = ?, rejection_reason = ?, approval_date = NOW()
       WHERE id = ?`,
      [req.user.id, rejection_reason, req.params.id]
    );
    res.json({ message: 'Voucher rejected.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reject voucher.' });
  }
});

module.exports = router;
