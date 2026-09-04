const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const voucherRoutes = require('./routes/voucher.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded signature images statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.use('/api/auth', authRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// Central error handler (e.g. multer file-size/type errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
});

module.exports = app;
