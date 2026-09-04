# Expense Voucher Management System

Full Stack Developer Internship Assignment — Prachay Securities Pvt. Ltd.

A web app that digitizes the employee expense voucher creation, approval, and
tracking process across three roles: **Employee**, **Director (Admin)**, and
**Accounts Team**.

**Stack:** React (frontend) · Node.js + Express (backend, REST API + JWT auth)
· MySQL (database) · Multer (signature image uploads)

---

## 1. Project Structure

```
expense-voucher-system/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # MySQL connection pool
│   │   ├── middleware/auth.js    # JWT verification + role guard
│   │   ├── middleware/upload.js  # Multer signature upload config
│   │   ├── routes/               # auth, voucher, dashboard routes
│   │   ├── utils/voucherNumber.js
│   │   ├── utils/seed.js         # creates one demo user per role
│   │   ├── app.js
│   │   └── server.js
│   ├── database/schema.sql
│   ├── uploads/signatures/       # uploaded signature images
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js          # axios instance + JWT interceptor
    │   ├── context/AuthContext.js
    │   ├── components/           # Navbar, ProtectedRoute, VoucherTable, StatusBadge
    │   ├── pages/employee/       # Dashboard, Create, My Vouchers, Edit Draft
    │   ├── pages/director/       # Dashboard, Pending Approvals, All Vouchers
    │   ├── pages/accounts/       # Dashboard, All Vouchers
    │   └── pages/VoucherDetails.js  # shared details view w/ role-aware approve/reject
    └── .env.example
```

## 2. Setup Instructions

### Prerequisites
- Node.js (v18+) and npm
- MySQL Server running locally (or update `.env` to point elsewhere)

### Backend
```bash
cd backend
npm install
cp .env.example .env        # edit DB_PASSWORD etc.
mysql -u root -p < database/schema.sql   # creates DB + tables
npm run seed                 # creates one demo login per role
npm run dev                  # starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start                    # starts on http://localhost:3000
```

### Demo Logins (created by `npm run seed`)
| Role     | Email              | Password       |
|----------|--------------------|----------------|
| Employee | employee@abc.com   | Employee@123   |
| Director | director@abc.com   | Director@123   |
| Accounts | accounts@abc.com   | Accounts@123   |

## 3. Database Schema Explanation

**`users`** — one row per person; `role` is one of `employee`, `director`,
`accounts`. Login and every authorization check is driven by this column.

**`vouchers`** — one row per expense voucher.
- `voucher_number` is unique and auto-generated (e.g. `EV-2026-0001`) via the
  `voucher_counters` helper table, which atomically increments a per-year
  counter inside a transaction (avoids duplicate numbers under concurrent
  requests).
- `status` enum drives the workflow: `draft → pending_approval → approved` or
  `rejected`. ("Submitted" and "Pending Approval" from the assignment's
  workflow diagram are modeled as a single `pending_approval` state, since a
  voucher is awaiting the Director's decision the moment it leaves Draft.)
- `employee_name` / `employee_code` are denormalized snapshots taken at
  creation time, so a voucher's displayed details don't change if the
  employee's profile is edited later.
- `employee_signature_path` / `director_signature_path` store the uploaded
  image file paths; actual files live in `backend/uploads/signatures/` and
  are served statically at `/uploads/signatures/<file>`.
- A `CHECK (amount > 0)` constraint enforces the "amount must be greater than
  zero" business rule at the database level as well as in the API.

**`voucher_counters`** — `(year, last_number)` pairs used only to generate
sequential voucher numbers per calendar year.

## 4. API Documentation

All endpoints (except `/auth/login`) require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint          | Access | Description |
|--------|-------------------|--------|--------------|
| POST   | `/api/auth/login` | Public | Returns JWT + user profile |
| GET    | `/api/auth/me`    | Any logged-in user | Returns decoded token payload |

### Vouchers
| Method | Endpoint                       | Access               | Description |
|--------|---------------------------------|-----------------------|--------------|
| GET    | `/api/vouchers`                 | Employee (own only), Director, Accounts | List with `search, status, department, category, dateFrom, dateTo, amountMin, amountMax, sortBy, sortOrder, pendingOnly` query params |
| GET    | `/api/vouchers/:id`              | Owner, Director, Accounts | Voucher details |
| POST   | `/api/vouchers`                  | Employee | Create voucher (always starts as Draft) |
| PUT    | `/api/vouchers/:id`               | Employee (own, Draft only) | Edit voucher fields |
| DELETE | `/api/vouchers/:id`               | Employee (own, Draft only) | Delete voucher |
| POST   | `/api/vouchers/:id/signature`     | Employee (own, Draft only) | Upload employee signature (`multipart/form-data`, field `signature`) |
| POST   | `/api/vouchers/:id/submit`        | Employee (own) | Draft → Pending Approval (requires signature already uploaded) |
| POST   | `/api/vouchers/:id/approve`       | Director | Pending Approval → Approved (`multipart/form-data`, field `signature`, required) |
| POST   | `/api/vouchers/:id/reject`        | Director | Pending Approval → Rejected (JSON body `{ rejection_reason }`, required) |

### Dashboards
| Method | Endpoint                     | Access   |
|--------|-------------------------------|----------|
| GET    | `/api/dashboard/employee`     | Employee |
| GET    | `/api/dashboard/director`     | Director |
| GET    | `/api/dashboard/accounts`     | Accounts |

## 5. Assumptions Made During Development

1. "Submitted" and "Pending Approval" in the workflow diagram are treated as
   the same database state (`pending_approval`) — a voucher moves straight
   from Draft into the Director's queue on submission.
2. Employee ID is optional (per spec) and is captured as `employee_code`,
   free-text, set at account/seed level rather than user self-entry.
3. There is no self-registration screen — user accounts (Employee, Director,
   Accounts) are provisioned directly in the database (see `npm run seed`
   for demo accounts, or insert additional rows into `users` following the
   same pattern for a real deployment).
4. Voucher numbers reset per calendar year (`EV-<year>-<sequence>`).
5. Only one Director role exists in this MVP (any user with `role='director'`
   can approve/reject any pending voucher) — the spec does not require
   per-department routing.
6. "Download or print vouchers" for the Accounts Team is listed as optional
   in the spec; the browser's native print (Ctrl/Cmd+P) on the Voucher
   Details page covers this rather than a dedicated PDF export endpoint.
7. Search/filter/sort (listed as a bonus point) is implemented for all three
   roles via shared query parameters on `GET /api/vouchers`.

## 6. File Upload

Signature images (PNG/JPG/JPEG/WEBP, max 2MB by default) are stored on disk
under `backend/uploads/signatures/` and referenced by path in the database.
Served statically at `http://localhost:5000/uploads/signatures/<filename>`.
