const pool = require('../config/db');

// Atomically generates the next voucher number for the current year, e.g. EV-2026-0001
async function generateVoucherNumber() {
  const year = new Date().getFullYear();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO voucher_counters (year, last_number) VALUES (?, 1)
       ON DUPLICATE KEY UPDATE last_number = last_number + 1`,
      [year]
    );
    const [rows] = await conn.query(
      `SELECT last_number FROM voucher_counters WHERE year = ?`,
      [year]
    );
    const nextNumber = rows[0].last_number;
    await conn.commit();

    const padded = String(nextNumber).padStart(4, '0');
    return `EV-${year}-${padded}`;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { generateVoucherNumber };
