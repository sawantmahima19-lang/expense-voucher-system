// Run with: npm run seed
// Creates one default user for each role so you can log in immediately.
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const defaultUsers = [
  { name: 'Priya Employee', email: 'employee@abc.com', password: 'Employee@123', role: 'employee', employee_code: 'EMP001', department: 'Engineering' },
  { name: 'Rakesh Director', email: 'director@abc.com', password: 'Director@123', role: 'director', employee_code: null, department: 'Management' },
  { name: 'Anita Accounts', email: 'accounts@abc.com', password: 'Accounts@123', role: 'accounts', employee_code: 'ACC001', department: 'Accounts' }
];

async function seed() {
  try {
    for (const u of defaultUsers) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (existing.length > 0) {
        console.log(`Skipping (already exists): ${u.email}`);
        continue;
      }
      const hash = await bcrypt.hash(u.password, 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, employee_code, department)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [u.name, u.email, hash, u.role, u.employee_code, u.department]
      );
      console.log(`Created ${u.role}: ${u.email} / ${u.password}`);
    }
    console.log('\nSeeding complete. You can log in with the credentials above.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    process.exit();
  }
}

seed();
