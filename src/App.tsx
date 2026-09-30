import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PageContainer } from './components/layout/PageContainer';

// Authentication
import { Login } from './pages/Login';

// Primary AP Reviewer Pages
import { Dashboard } from './pages/Dashboard';
import { UploadInvoices } from './pages/UploadInvoices';
import { Invoices } from './pages/Invoices';
import { InvoiceDetails } from './pages/InvoiceDetails';
import { Exceptions } from './pages/Exceptions';
import { AuditLog } from './pages/AuditLog';
import { Assistant } from './pages/Assistant';
import { Settings } from './pages/Settings';

// Requester Portal Pages
import { RequesterDashboard } from './pages/requester/RequesterDashboard';
import { SubmitInvoice } from './pages/requester/SubmitInvoice';
import { MyInvoices } from './pages/requester/MyInvoices';
import { RequesterNotifications } from './pages/requester/RequesterNotifications';
import { RequesterProfile } from './pages/requester/RequesterProfile';

// Finance Manager Portal Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { Analytics } from './pages/manager/Analytics';
import { UsersAndRoles } from './pages/manager/UsersAndRoles';
import { PolicyRulesConfig } from './pages/manager/PolicyRulesConfig';

// Helper component for smart root redirect based on active role
const RootRedirect: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'REQUESTER') return <Navigate to="/requester/dashboard" replace />;
  if (role === 'FINANCE_MANAGER') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex text-slate-800">
      {/* Global Left Sidebar with dynamic role navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        exceptionCount={26}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header with Role Switcher & Profile Logout */}
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Page Content View */}
        <main className="flex-1 py-4 sm:py-6">
          <PageContainer>
            <Routes>
              {/* Root Smart Redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* ============================================================ */}
              {/* 1. REQUESTER PORTAL ROUTES */}
              {/* ============================================================ */}
              <Route
                path="/requester/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER']}>
                    <RequesterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requester/submit"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER']}>
                    <SubmitInvoice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requester/invoices"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER']}>
                    <MyInvoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requester/notifications"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER']}>
                    <RequesterNotifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requester/profile"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER']}>
                    <RequesterProfile />
                  </ProtectedRoute>
                }
              />

              {/* ============================================================ */}
              {/* 2. AP REVIEWER PORTAL ROUTES (Primary) */}
              {/* ============================================================ */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['AP_REVIEWER', 'FINANCE_MANAGER']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute allowedRoles={['AP_REVIEWER', 'FINANCE_MANAGER']}>
                    <UploadInvoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute allowedRoles={['AP_REVIEWER', 'FINANCE_MANAGER']}>
                    <Invoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exceptions"
                element={
                  <ProtectedRoute allowedRoles={['AP_REVIEWER', 'FINANCE_MANAGER']}>
                    <Exceptions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assistant"
                element={
                  <ProtectedRoute allowedRoles={['AP_REVIEWER', 'FINANCE_MANAGER']}>
                    <Assistant />
                  </ProtectedRoute>
                }
              />

              {/* ============================================================ */}
              {/* 3. FINANCE MANAGER / ADMIN PORTAL ROUTES */}
              {/* ============================================================ */}
              <Route
                path="/manager/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['FINANCE_MANAGER']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/analytics"
                element={
                  <ProtectedRoute allowedRoles={['FINANCE_MANAGER']}>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/users"
                element={
                  <ProtectedRoute allowedRoles={['FINANCE_MANAGER']}>
                    <UsersAndRoles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/policies"
                element={
                  <ProtectedRoute allowedRoles={['FINANCE_MANAGER']}>
                    <PolicyRulesConfig />
                  </ProtectedRoute>
                }
              />

              {/* Shared Protected Pages */}
              <Route
                path="/audit-log"
                element={
                  <ProtectedRoute allowedRoles={['AP_REVIEWER', 'FINANCE_MANAGER']}>
                    <AuditLog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['AP_REVIEWER', 'FINANCE_MANAGER']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Shared Invoice Details (Adapts permissions based on role) */}
              <Route path="/invoices/:id" element={<InvoiceDetails />} />

              {/* Catch-all */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </PageContainer>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
