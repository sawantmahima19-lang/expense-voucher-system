import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/employee').then((res) => setData(res.data.dashboard));
  }, []);

  if (!data) return <div className="page"><p>Loading...</p></div>;

  const cards = [
    { label: 'Total Vouchers', value: data.total },
    { label: 'Draft', value: data.draft },
    { label: 'Pending Approval', value: data.pending_approval },
    { label: 'Approved', value: data.approved },
    { label: 'Rejected', value: data.rejected },
    { label: 'Total Amount Claimed', value: `₹${Number(data.total_amount_claimed).toLocaleString('en-IN')}` }
  ];

  return (
    <div className="page">
      <h2>Employee Dashboard</h2>
      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-value">{c.value ?? 0}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
