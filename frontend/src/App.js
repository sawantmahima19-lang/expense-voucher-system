import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import VoucherDetails from './pages/VoucherDetails';

import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import CreateVoucher from './pages/employee/CreateVoucher';
import MyVouchers from './pages/employee/MyVouchers';
import EditVoucher from './pages/employee/EditVoucher';

import DirectorDashboard from './pages/director/DirectorDashboard';
import PendingApprovals from './pages/director/PendingApprovals';
import AllVouchersDirector from './pages/director/AllVouchersDirector';

import AccountsDashboard from './pages/accounts/AccountsDashboard';
import AllVouchersAccounts from './pages/accounts/AllVouchersAccounts';

const roleHome = { employee: '/employee/dashboard', director: '/director/dashboard', accounts: '/accounts/dashboard' };

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome[user.role] || '/login'} replace />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/voucher/:id" element={
          <ProtectedRoute><VoucherDetails /></ProtectedRoute>
        } />

        {/* Employee */}
        <Route path="/employee/dashboard" element={
          <ProtectedRoute roles={['employee']}><EmployeeDashboard /></ProtectedRoute>
        } />
        <Route path="/employee/create" element={
          <ProtectedRoute roles={['employee']}><CreateVoucher /></ProtectedRoute>
        } />
        <Route path="/employee/vouchers" element={
          <ProtectedRoute roles={['employee']}><MyVouchers /></ProtectedRoute>
        } />
        <Route path="/employee/edit/:id" element={
          <ProtectedRoute roles={['employee']}><EditVoucher /></ProtectedRoute>
        } />

        {/* Director */}
        <Route path="/director/dashboard" element={
          <ProtectedRoute roles={['director']}><DirectorDashboard /></ProtectedRoute>
        } />
        <Route path="/director/pending" element={
          <ProtectedRoute roles={['director']}><PendingApprovals /></ProtectedRoute>
        } />
        <Route path="/director/vouchers" element={
          <ProtectedRoute roles={['director']}><AllVouchersDirector /></ProtectedRoute>
        } />

        {/* Accounts */}
        <Route path="/accounts/dashboard" element={
          <ProtectedRoute roles={['accounts']}><AccountsDashboard /></ProtectedRoute>
        } />
        <Route path="/accounts/vouchers" element={
          <ProtectedRoute roles={['accounts']}><AllVouchersAccounts /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
