import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GmailAppShell from './components/layout/GmailAppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import CitizenPortal from './features/citizen/CitizenPortal';

// Lazy load heavy staff/admin workspaces for bundle optimization
const OfficerWorkspace = lazy(() => import('./features/officer/OfficerWorkspace'));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-3 border-[#0B57D0] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  if (isLoginPage) {
    return <LoginPage />;
  }

  if (isRegisterPage) {
    return <RegisterPage />;
  }

  return (
    <GmailAppShell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* 1. Route Cổng Người Dân & Quét Đơn (Cho phép mọi role đã đăng nhập nhờ kế thừa: CITIZEN) */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenPortal />
              </ProtectedRoute>
            }
          />

          {/* 2. Route Bàn Làm Việc Cán Bộ (Cho phép OFFICER & ADMIN tự động vào được nhờ kế thừa: OFFICER) */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={['OFFICER']}>
                <OfficerWorkspace />
              </ProtectedRoute>
            }
          />

          {/* 3. Route Quản Trị Hệ Thống & RAG (Chỉ duy nhất ADMIN được phép truy cập) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 4. Tra cứu mã hồ sơ (Mở phân hệ Tra cứu trong Cổng công dân) */}
          <Route
            path="/tracking"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenPortal initialTab="lookup" />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </GmailAppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
