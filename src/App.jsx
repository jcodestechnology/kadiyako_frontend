import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserCreate from './pages/UserCreate';
import UserDetails from './pages/UserDetails';
import Roles from './pages/Roles';
import RoleDetails from './pages/RoleDetails';
import Permissions from './pages/Permissions';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0892d0',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          colorBgContainer: '#ffffff',
          colorText: '#1f1f1f',
          colorTextSecondary: '#8c8c8c',
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/create" element={<UserCreate />} />
                <Route path="/users/:id" element={<UserDetails />} />
                <Route path="/roles" element={<Roles />} />
                <Route path="/roles/:id" element={<RoleDetails />} />
                <Route path="/permissions" element={<Permissions />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
