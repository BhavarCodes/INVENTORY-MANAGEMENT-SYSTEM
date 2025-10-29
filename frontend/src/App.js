import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BusinessProvider } from './contexts/BusinessContext';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AuthCallback from './components/auth/AuthCallback';
import EmailVerification from './components/auth/EmailVerification';
import Dashboard from './components/dashboard/Dashboard';
import Inventory from './components/inventory/Inventory';
import Orders from './components/orders/Orders';
import Payment from './components/payments/Payment';
import Notifications from './components/notifications/Notifications';
import Profile from './components/profile/Profile';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Analytics from './components/analytics/Analytics';
import Settings from './components/settings/Settings';
import DebugAuth from './components/DebugAuth';
import Sales from './components/sales/Sales';

// Styles
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" /> : <Register />} 
          />
          <Route 
            path="/verify-email/:token" 
            element={<EmailVerification />} 
          />
          <Route 
            path="/auth/callback" 
            element={<AuthCallback />} 
          />
          <Route 
            path="/debug" 
            element={<DebugAuth />} 
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="orders" element={<Orders />} />
            <Route path="payment/:orderId" element={<Payment />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="sales" element={<Sales />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </BusinessProvider>
    </AuthProvider>
  );
}

export default App;
