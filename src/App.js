import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';

import CustomerBrowse from './pages/customer/Browse';
import CustomerDetail from './pages/customer/ItemDetail';
import CustomerOrders from './pages/customer/Orders';
import CustomerProfile from './pages/customer/Profile';
import CustomerMap from './pages/customer/MapView';
import CustomerLogin from './pages/customer/Login';

// Free browsing — no login needed
function FreeRoute({ children }) {
  const { loading } = useAuth();
  if (loading) return <div className="app-shell"><div className="spinner" /></div>;
  return <div className="app-shell">{children}</div>;
}

// Protected — needs customer login
function CustomerRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="app-shell"><div className="spinner" /></div>;
  if (!user || profile?.role !== 'customer') return <Navigate to="/login" replace />;
  return <div className="app-shell">{children}</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public — open to all */}
          <Route path="/" element={<FreeRoute><CustomerBrowse /></FreeRoute>} />
          <Route path="/browse" element={<FreeRoute><CustomerBrowse /></FreeRoute>} />
          <Route path="/map" element={<FreeRoute><CustomerMap /></FreeRoute>} />
          <Route path="/item/:id" element={<FreeRoute><CustomerDetail /></FreeRoute>} />
          <Route path="/login" element={<FreeRoute><CustomerLogin /></FreeRoute>} />

          {/* Protected — login required */}
          <Route path="/orders" element={<CustomerRoute><CustomerOrders /></CustomerRoute>} />
          <Route path="/profile" element={<CustomerRoute><CustomerProfile /></CustomerRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
