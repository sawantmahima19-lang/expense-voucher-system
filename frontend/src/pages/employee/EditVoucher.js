import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const uploadsBase = process.env.REACT_APP_UPLOADS_URL || 'http://localhost:5000';

export default function EditVoucher() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState(null);
  const [form, setForm] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await api.get(`/vouchers/${id}`);
    setVoucher(res.data.voucher);
    setForm({
      voucher_date: res.data.voucher.voucher_date,
      expense_date: res.data.voucher.expense_date,
      department_name: res.data.voucher.department_name,
      expense_title: res.data.voucher.expense_title,
      expense_category: res.data.voucher.expense_category,
      expense_description: res.data.voucher.expense_description || '',
      amount: res.data.voucher.amount
    });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (!voucher || !form) return <div className="page"><p>Loading...</p></div>;

  const isDraft = voucher.status === 'draft';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setBusy(true);
    try {
      await api.put(`/vouchers/${id}`, form);
      setInfo('Voucher updated.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update.');
    } finally { setBusy(false); }
  };

  const handleSignatureUpload = async () => {
    setError(''); setInfo('');
    if (!signatureFile) return setError('Choose a signature image first.');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('signature', signatureFile);
      await api.post(`/vouchers/${id}/signature`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setInfo('Signature uploaded.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload signature.');
    } finally { setBusy(false); }
  };

  const handleSubmitForApproval = async () => {
    setError(''); setInfo('');
    setBusy(true);
    try {
      await api.post(`/vouchers/${id}/submit`);
      navigate('/employee/vouchers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit.');
    } finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this draft voucher? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api.delete(`/vouchers/${id}`);
      navigate('/employee/vouchers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h2>Voucher {voucher.voucher_number} {!isDraft && '(Read-only)'}</h2>
      {error && <p className="error-text">{error}</p>}
      {info && <p className="info-text">{info}</p>}

      <form className="voucher-form" onSubmit={handleSave}>
        <label>Voucher Date
          <input type="date" name="voucher_date" value={form.voucher_date} onChange={handleChange} disabled={!isDraft} />
        </label>
        <label>Expense Date *
          <input type="date" name="expense_date" value={form.expense_date} onChange={handleChange} disabled={!isDraft} required />
        </label>
        <label>Department *
          <input name="department_name" value={form.department_name} onChange={handleChange} disabled={!isDraft} required />
        </label>
        <label>Expense Title *
          <input name="expense_title" value={form.expense_title} onChange={handleChange} disabled={!isDraft} required />
        </label>
        <label>Expense Category
          <input name="expense_category" value={form.expense_category} onChange={handleChange} disabled={!isDraft} />
        </label>
        <label>Expense Description
          <textarea name="expense_description" value={form.expense_description} onChange={handleChange} disabled={!isDraft} />
        </label>
        <label>Amount (₹) *
          <input type="number" min="0.01" step="0.01" name="amount" value={form.amount} onChange={handleChange} disabled={!isDraft} required />
        </label>
        {isDraft && <button type="submit" disabled={busy}>Save Changes</button>}
      </form>

      <div className="signature-panel">
        <h3>Employee Signature {voucher.employee_signature_url ? '✔' : '(required before submission)'}</h3>
        {voucher.employee_signature_url && (
          <img className="signature-img" src={`${uploadsBase}${voucher.employee_signature_url}`} alt="signature" />
        )}
        {isDraft && (
          <>
            <input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files[0])} />
            <button disabled={busy} onClick={handleSignatureUpload}>Upload Signature</button>
          </>
        )}
      </div>

      {isDraft && (
        <div className="action-bar">
          <button disabled={busy} onClick={handleSubmitForApproval}>Submit for Approval</button>
          <button disabled={busy} className="btn-danger" onClick={handleDelete}>Delete Draft</button>
        </div>
      )}
    </div>
  );
}
