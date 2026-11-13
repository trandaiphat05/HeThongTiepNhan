import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import CitizenPortal from './features/citizen/CitizenPortal';
import OfficerWorkspace from './features/officer/OfficerWorkspace';
import AdminDashboard from './features/admin/AdminDashboard';

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
    <div className="min-h-screen flex flex-col bg-gov-slate-bg font-sans text-gov-slate-text">
      {/* Header Cố Định Chứa Navigation Chuẩn Hành Chính */}
      <Header />

      {/* Vùng Định Tuyến Nội Dung Được Bảo Vệ (RBAC) */}
      <main className="flex-1">
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

          {/* Fallback cho các đường dẫn lạ về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Chân Trang Hành Chính */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Đường dẫn đăng nhập và đăng ký công khai */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Các tuyến đường chính */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
