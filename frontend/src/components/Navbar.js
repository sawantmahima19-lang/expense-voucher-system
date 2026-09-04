import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = {
    employee: [
      { to: '/employee/dashboard', label: 'Dashboard' },
      { to: '/employee/create', label: 'Create Voucher' },
      { to: '/employee/vouchers', label: 'My Vouchers' }
    ],
    director: [
      { to: '/director/dashboard', label: 'Dashboard' },
      { to: '/director/pending', label: 'Pending Approvals' },
      { to: '/director/vouchers', label: 'All Vouchers' }
    ],
    accounts: [
      { to: '/accounts/dashboard', label: 'Dashboard' },
      { to: '/accounts/vouchers', label: 'All Vouchers' }
    ]
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">Expense Voucher System</div>
      <div className="navbar-links">
        {(links[user.role] || []).map((l) => (
          <Link key={l.to} to={l.to}>{l.label}</Link>
        ))}
      </div>
      <div className="navbar-user">
        <span>{user.name} <em>({user.role})</em></span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
