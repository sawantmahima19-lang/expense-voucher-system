import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AccountsDashboard() {
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/dashboard/accounts').then((res) => {
      setData(res.data.dashboard);
      setRecent(res.data.recentApproved);
    });
  }, []);

  if (!data) return <div className="page"><p>Loading...</p></div>;

  const cards = [
    { label: 'Total Vouchers', value: data.total },
    { label: 'Pending Approval', value: data.pending_approval },
    { label: 'Approved', value: data.approved },
    { label: 'Rejected', value: data.rejected },
    { label: 'Total Approved Expense', value: `₹${Number(data.total_approved_amount).toLocaleString('en-IN')}` }
  ];

  return (
    <div className="page">
      <h2>Accounts Dashboard</h2>
      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-value">{c.value ?? 0}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <h3>Recent Approved Vouchers</h3>
      <table className="voucher-table">
        <thead><tr><th>Voucher #</th><th>Employee</th><th>Amount</th><th>Approval Date</th></tr></thead>
        <tbody>
          {recent.map((v) => (
            <tr key={v.id}>
              <td><Link to={`/voucher/${v.id}`}>{v.voucher_number}</Link></td>
              <td>{v.employee_name}</td>
              <td>₹{Number(v.amount).toLocaleString('en-IN')}</td>
              <td>{v.approval_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
