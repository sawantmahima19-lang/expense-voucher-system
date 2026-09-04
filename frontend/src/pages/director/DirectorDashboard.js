import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function DirectorDashboard() {
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/dashboard/director').then((res) => {
      setData(res.data.dashboard);
      setRecent(res.data.recentActivity);
    });
  }, []);

  if (!data) return <div className="page"><p>Loading...</p></div>;

  const cards = [
    { label: 'Pending Approval', value: data.pending_approval_count },
    { label: 'Approved Today', value: data.approved_today },
    { label: 'Rejected Today', value: data.rejected_today },
    { label: 'Total Pending Amount', value: `₹${Number(data.total_pending_amount).toLocaleString('en-IN')}` }
  ];

  return (
    <div className="page">
      <h2>Director Dashboard</h2>
      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-value">{c.value ?? 0}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <h3>Recent Voucher Activity</h3>
      <table className="voucher-table">
        <thead><tr><th>Voucher #</th><th>Employee</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          {recent.map((v) => (
            <tr key={v.id}>
              <td><Link to={`/voucher/${v.id}`}>{v.voucher_number}</Link></td>
              <td>{v.employee_name}</td>
              <td>₹{Number(v.amount).toLocaleString('en-IN')}</td>
              <td><StatusBadge status={v.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
