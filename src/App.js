import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';

import Landing from './pages/Landing';
import RestaurantLogin from './pages/restaurant/Login';
import RestaurantRegister from './pages/restaurant/Register';
import RestaurantDashboard from './pages/restaurant/Dashboard';
import RestaurantPost from './pages/restaurant/PostItem';
import RestaurantOrders from './pages/restaurant/Orders';
import RestaurantProfile from './pages/restaurant/Profile';
import RestaurantEarnings from './pages/restaurant/Earnings';
import CustomerLogin from './pages/customer/Login';
import CustomerBrowse from './pages/customer/Browse';
import CustomerDetail from './pages/customer/ItemDetail';
import CustomerOrders from './pages/customer/Orders';
import CustomerProfile from './pages/customer/Profile';
import CustomerMap from './pages/customer/MapView';

function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="app-shell"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && profile?.role !== role) return <Navigate to="/" replace />;
  return <div className="app-shell">{children}</div>;
}

function PublicRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="app-shell"><div className="spinner" /></div>;
  if (user && profile) {
    return <Navigate to={profile.role === 'restaurant' ? '/restaurant/dashboard' : '/customer/browse'} replace />;
  }
  return <div className="app-shell">{children}</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />

          {/* Restaurant */}
          <Route path="/restaurant/login" element={<PublicRoute><RestaurantLogin /></PublicRoute>} />
          <Route path="/restaurant/register" element={<PublicRoute><RestaurantRegister /></PublicRoute>} />
          <Route path="/restaurant/dashboard" element={<ProtectedRoute role="restaurant"><RestaurantDashboard /></ProtectedRoute>} />
          <Route path="/restaurant/post" element={<ProtectedRoute role="restaurant"><RestaurantPost /></ProtectedRoute>} />
          <Route path="/restaurant/orders" element={<ProtectedRoute role="restaurant"><RestaurantOrders /></ProtectedRoute>} />
          <Route path="/restaurant/earnings" element={<ProtectedRoute role="restaurant"><RestaurantEarnings /></ProtectedRoute>} />
          <Route path="/restaurant/profile" element={<ProtectedRoute role="restaurant"><RestaurantProfile /></ProtectedRoute>} />

          {/* Customer — phone OTP login, no separate register page */}
          <Route path="/customer/login" element={<PublicRoute><CustomerLogin /></PublicRoute>} />
          <Route path="/customer/browse" element={<ProtectedRoute role="customer"><CustomerBrowse /></ProtectedRoute>} />
          <Route path="/customer/map" element={<ProtectedRoute role="customer"><CustomerMap /></ProtectedRoute>} />
          <Route path="/customer/item/:id" element={<ProtectedRoute role="customer"><CustomerDetail /></ProtectedRoute>} />
          <Route path="/customer/orders" element={<ProtectedRoute role="customer"><CustomerOrders /></ProtectedRoute>} />
          <Route path="/customer/profile" element={<ProtectedRoute role="customer"><CustomerProfile /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
