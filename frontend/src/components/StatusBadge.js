import React from 'react';

const labels = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected'
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}
