import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const categories = ['Travel', 'Food & Lodging', 'Office Supplies', 'Client Entertainment', 'Communication', 'Miscellaneous'];

export default function CreateVoucher() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    voucher_date: new Date().toISOString().slice(0, 10),
    expense_date: '', department_name: '', expense_title: '',
    expense_category: categories[0], expense_description: '', amount: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/vouchers', form);
      navigate(`/employee/edit/${res.data.voucherId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create voucher.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h2>Create Voucher</h2>
      <form className="voucher-form" onSubmit={handleSubmit}>
        {error && <p className="error-text">{error}</p>}

        <label>Voucher Date
          <input type="date" name="voucher_date" value={form.voucher_date} onChange={handleChange} />
        </label>
        <label>Expense Date *
          <input type="date" name="expense_date" value={form.expense_date} onChange={handleChange} required />
        </label>
        <label>Department *
          <input name="department_name" value={form.department_name} onChange={handleChange} required />
        </label>
        <label>Expense Title *
          <input name="expense_title" value={form.expense_title} onChange={handleChange} required />
        </label>
        <label>Expense Category
          <select name="expense_category" value={form.expense_category} onChange={handleChange}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Expense Description
          <textarea name="expense_description" value={form.expense_description} onChange={handleChange} />
        </label>
        <label>Amount (₹) *
          <input type="number" min="0.01" step="0.01" name="amount" value={form.amount} onChange={handleChange} required />
        </label>

        <button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save as Draft'}</button>
      </form>
      <p className="hint">After saving as Draft, you'll be able to upload your signature and submit for approval.</p>
    </div>
  );
}
