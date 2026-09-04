import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome = { employee: '/employee/dashboard', director: '/director/dashboard', accounts: '/accounts/dashboard' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleHome[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Expense Voucher System</h1>
        <p className="subtitle">Sign in to continue</p>
        {error && <p className="error-text">{error}</p>}
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>

        <div className="seed-hint">
          <strong>Demo accounts (after running the seed script):</strong>
          <ul>
            <li>employee@abc.com / Employee@123</li>
            <li>director@abc.com / Director@123</li>
            <li>accounts@abc.com / Accounts@123</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
