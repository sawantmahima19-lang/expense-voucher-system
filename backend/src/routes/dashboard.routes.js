const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/dashboard/employee
router.get('/employee', requireRole('employee'), async (req, res) => {
  try {
    const empId = req.user.id;
    const [[counts]] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(status='draft') AS draft,
        SUM(status='pending_approval') AS pending_approval,
        SUM(status='approved') AS approved,
        SUM(status='rejected') AS rejected,
        COALESCE(SUM(CASE WHEN status='approved' THEN amount ELSE 0 END),0) AS total_amount_claimed
       FROM vouchers WHERE employee_id = ?`,
      [empId]
    );
    res.json({ dashboard: counts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard.' });
  }
});

// GET /api/dashboard/director
router.get('/director', requireRole('director'), async (req, res) => {
  try {
    const [[counts]] = await pool.query(
      `SELECT
        SUM(status='pending_approval') AS pending_approval_count,
        SUM(status='approved' AND DATE(approval_date) = CURDATE()) AS approved_today,
        SUM(status='rejected' AND DATE(approval_date) = CURDATE()) AS rejected_today,
        COALESCE(SUM(CASE WHEN status='pending_approval' THEN amount ELSE 0 END),0) AS total_pending_amount
       FROM vouchers`
    );
    const [recent] = await pool.query(
      `SELECT id, voucher_number, employee_name, status, amount, updated_at
       FROM vouchers ORDER BY updated_at DESC LIMIT 8`
    );
    res.json({ dashboard: counts, recentActivity: recent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard.' });
  }
});

// GET /api/dashboard/accounts
router.get('/accounts', requireRole('accounts'), async (req, res) => {
  try {
    const [[counts]] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(status='pending_approval') AS pending_approval,
        SUM(status='approved') AS approved,
        SUM(status='rejected') AS rejected,
        COALESCE(SUM(CASE WHEN status='approved' THEN amount ELSE 0 END),0) AS total_approved_amount
       FROM vouchers`
    );
    const [recentApproved] = await pool.query(
      `SELECT id, voucher_number, employee_name, amount, approval_date
       FROM vouchers WHERE status='approved' ORDER BY approval_date DESC LIMIT 8`
    );
    res.json({ dashboard: counts, recentApproved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard.' });
  }
});

module.exports = router;
