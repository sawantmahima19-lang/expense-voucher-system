import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const uploadsBase = process.env.REACT_APP_UPLOADS_URL || 'http://localhost:5000';

export default function VoucherDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [directorSignature, setDirectorSignature] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/vouchers/${id}`);
      setVoucher(res.data.voucher);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load voucher.');
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const handleApprove = async () => {
    setActionError('');
    if (!directorSignature) return setActionError('Director Signature is mandatory before approval.');
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('signature', directorSignature);
      await api.post(`/vouchers/${id}/approve`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setActionError('');
    if (!rejectionReason.trim()) return setActionError('Rejection Reason is mandatory if a voucher is rejected.');
    setBusy(true);
    try {
      await api.post(`/vouchers/${id}/reject`, { rejection_reason: rejectionReason });
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!voucher) return <div className="page"><p>Loading...</p></div>;

  const canEdit = user.role === 'employee' && voucher.employee_id === user.id && voucher.status === 'draft';

  return (
    <div className="page">
      <div className="details-header">
        <h2>Voucher {voucher.voucher_number}</h2>
        <StatusBadge status={voucher.status} />
      </div>

      <div className="details-grid">
        <div className="details-section">
          <h3>Basic Information</h3>
          <p><strong>Voucher Date:</strong> {voucher.voucher_date}</p>
          <p><strong>Expense Date:</strong> {voucher.expense_date}</p>
          <p><strong>Department:</strong> {voucher.department_name}</p>
          <p><strong>Expense Title:</strong> {voucher.expense_title}</p>
          <p><strong>Category:</strong> {voucher.expense_category}</p>
          <p><strong>Description:</strong> {voucher.expense_description || '—'}</p>
          <p><strong>Amount:</strong> ₹{Number(voucher.amount).toLocaleString('en-IN')}</p>
        </div>

        <div className="details-section">
          <h3>Employee Information</h3>
          <p><strong>Name:</strong> {voucher.employee_name}</p>
          <p><strong>Employee ID:</strong> {voucher.employee_code || '—'}</p>
          <p><strong>Signature:</strong></p>
          {voucher.employee_signature_url
            ? <img className="signature-img" src={`${uploadsBase}${voucher.employee_signature_url}`} alt="Employee signature" />
            : <em>Not uploaded yet</em>}
        </div>

        <div className="details-section">
          <h3>Approval Information</h3>
          <p><strong>Status:</strong> <StatusBadge status={voucher.status} /></p>
          <p><strong>Approval Date:</strong> {voucher.approval_date || '—'}</p>
          {voucher.status === 'rejected' && <p><strong>Rejection Reason:</strong> {voucher.rejection_reason}</p>}
          <p><strong>Director Signature:</strong></p>
          {voucher.director_signature_url
            ? <img className="signature-img" src={`${uploadsBase}${voucher.director_signature_url}`} alt="Director signature" />
            : <em>Not yet approved</em>}
        </div>

        <div className="details-section">
          <h3>Audit Information</h3>
          <p><strong>Created:</strong> {voucher.created_at}</p>
          <p><strong>Last Updated:</strong> {voucher.updated_at}</p>
        </div>
      </div>

      {canEdit && (
        <button onClick={() => navigate(`/employee/edit/${voucher.id}`)}>Edit Draft Voucher</button>
      )}

      {user.role === 'director' && voucher.status === 'pending_approval' && (
        <div className="approval-panel">
          <h3>Director Action</h3>
          {actionError && <p className="error-text">{actionError}</p>}
          <label>Director Signature (required to approve)
            <input type="file" accept="image/*" onChange={(e) => setDirectorSignature(e.target.files[0])} />
          </label>
          <button disabled={busy} onClick={handleApprove}>Approve</button>

          <label>Rejection Reason (required to reject)
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          </label>
          <button disabled={busy} className="btn-danger" onClick={handleReject}>Reject</button>
        </div>
      )}
    </div>
  );
}
