-- Expense Voucher Management System - MySQL Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS expense_voucher_db;
USE expense_voucher_db;

-- ============================
-- USERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('employee', 'director', 'accounts') NOT NULL,
    employee_code VARCHAR(50) DEFAULT NULL,   -- Employee ID, optional
    department VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================
-- VOUCHERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,   -- auto-generated e.g. EV-2026-0001

    -- Basic Information
    voucher_date DATE NOT NULL,
    expense_date DATE NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    expense_title VARCHAR(200) NOT NULL,
    expense_category VARCHAR(100) NOT NULL,
    expense_description TEXT,
    amount DECIMAL(12,2) NOT NULL,

    -- Employee Information
    employee_id INT NOT NULL,                     -- FK -> users.id (creator)
    employee_name VARCHAR(150) NOT NULL,           -- denormalized snapshot
    employee_code VARCHAR(50) DEFAULT NULL,
    employee_signature_path VARCHAR(255) DEFAULT NULL,

    -- Approval Information
    status ENUM('draft', 'pending_approval', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    director_id INT DEFAULT NULL,                  -- FK -> users.id (who approved/rejected)
    director_signature_path VARCHAR(255) DEFAULT NULL,
    approval_date DATETIME DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL,

    -- Audit Information
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_voucher_employee FOREIGN KEY (employee_id) REFERENCES users(id),
    CONSTRAINT fk_voucher_director FOREIGN KEY (director_id) REFERENCES users(id),
    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_vouchers_employee ON vouchers(employee_id);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_vouchers_department ON vouchers(department_name);
CREATE INDEX idx_vouchers_category ON vouchers(expense_category);
CREATE INDEX idx_vouchers_expense_date ON vouchers(expense_date);

-- ============================
-- VOUCHER NUMBER SEQUENCE HELPER
-- ============================
-- A simple counter table used to atomically generate voucher numbers like EV-2026-0001
CREATE TABLE IF NOT EXISTS voucher_counters (
    year INT PRIMARY KEY,
    last_number INT NOT NULL DEFAULT 0
);
