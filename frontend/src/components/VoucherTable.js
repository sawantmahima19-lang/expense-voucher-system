import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from './StatusBadge';

// Reusable, filterable/sortable voucher table used by Employee, Director and Accounts screens.
// `extraParams` (e.g. { pendingOnly: 'true' }) lets a screen pre-scope the list.
export default function VoucherTable({ extraParams = {}, title = 'Vouchers' }) {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '', status: '', department: '', category: '',
    dateFrom: '', dateTo: '', amountMin: '', amountMax: '',
    sortBy: 'created_at', sortOrder: 'desc'
  });

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, ...extraParams };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await api.get('/vouchers', { params });
      setVouchers(res.data.vouchers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vouchers.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <div className="voucher-table-wrap">
      <h2>{title}</h2>

      <div className="filters-bar">
        <input name="search" placeholder="Search voucher # or employee" value={filters.search} onChange={handleChange} />
        <select name="status" value={filters.status} onChange={handleChange}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input name="department" placeholder="Department" value={filters.department} onChange={handleChange} />
        <input name="category" placeholder="Category" value={filters.category} onChange={handleChange} />
        <label>From <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleChange} /></label>
        <label>To <input type="date" name="dateTo" value={filters.dateTo} onChange={handleChange} /></label>
        <input name="amountMin" type="number" placeholder="Min ₹" value={filters.amountMin} onChange={handleChange} />
        <input name="amountMax" type="number" placeholder="Max ₹" value={filters.amountMax} onChange={handleChange} />
        <select name="sortBy" value={filters.sortBy} onChange={handleChange}>
          <option value="created_at">Created Date</option>
          <option value="voucher_date">Voucher Date</option>
          <option value="expense_date">Expense Date</option>
          <option value="amount">Amount</option>
          <option value="status">Status</option>
          <option value="employee_name">Employee Name</option>
        </select>
        <select name="sortOrder" value={filters.sortOrder} onChange={handleChange}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <table className="voucher-table">
          <thead>
            <tr>
              <th>Voucher #</th><th>Employee</th><th>Department</th>
              <th>Category</th><th>Expense Date</th><th>Amount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No vouchers found.</td></tr>
            )}
            {vouchers.map((v) => (
              <tr key={v.id} className="clickable-row" onClick={() => navigate(`/voucher/${v.id}`)}>
                <td>{v.voucher_number}</td>
                <td>{v.employee_name}</td>
                <td>{v.department_name}</td>
                <td>{v.expense_category}</td>
                <td>{v.expense_date}</td>
                <td>₹{Number(v.amount).toLocaleString('en-IN')}</td>
                <td><StatusBadge status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
