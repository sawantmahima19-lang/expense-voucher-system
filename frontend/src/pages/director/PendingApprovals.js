import React from 'react';
import VoucherTable from '../../components/VoucherTable';

export default function PendingApprovals() {
  return <div className="page"><VoucherTable title="Pending Approvals" extraParams={{ pendingOnly: 'true' }} /></div>;
}
