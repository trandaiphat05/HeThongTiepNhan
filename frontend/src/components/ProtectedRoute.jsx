import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Giao diện cảnh báo khi người dùng không đủ thẩm quyền RBAC
 * Tự động chuyển hướng an toàn về Cổng Tiếp nhận Công dân sau 4 giây.
 */
function UnauthorizedView({ user, allowedRoles, logout }) {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(4);
  const isCitizen = user?.role === 'CITIZEN';

  let fallbackPath = '/';
  let fallbackLabel = 'Về Cổng Tiếp Nhận Công Dân';
  if (user?.role === 'OFFICER') {
    fallbackPath = '/officer';
    fallbackLabel = 'Về Bàn Làm Việc Cán Bộ';
  } else if (user?.role === 'ADMIN') {
    fallbackPath = '/admin';
    fallbackLabel = 'Về Trung Tâm Quản Trị';
  }

  useEffect(() => {
    if (secondsLeft <= 0) {
      navigate(fallbackPath, { replace: true });
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, fallbackPath, navigate]);

  return (
    <div className="max-w-2xl mx-auto my-12 px-4 sm:px-6">
      <div className="gov-card p-6 sm:p-8 text-center space-y-5 border-amber-200 bg-amber-50/30">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-rose-700">
            Bạn không có quyền truy cập chức năng này
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {isCitizen ? (
              <>Tài khoản <strong className="text-slate-900">{user?.full_name}</strong> có vai trò <span className="bg-slate-200 text-slate-800 font-mono text-xs px-2 py-0.5 rounded font-bold">CÔNG DÂN</span>, chỉ được phép gửi phản ánh và tra cứu tiến độ hồ sơ cá nhân tại Cổng Dịch Vụ Công.</>
            ) : (
              <>Tài khoản hiện tại của bạn là <strong className="text-slate-900">{user?.full_name}</strong> (Mã vai trò: <span className="bg-slate-200 text-slate-800 font-mono text-xs px-2 py-0.5 rounded font-bold">{user?.role}</span>) không thuộc danh mục được phép truy cập phân hệ nghiệp vụ này.</>
            )}
          </p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-500 inline-block text-left max-w-md w-full">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
            <CheckCircle2 className="w-4 h-4 text-gov-blue" />
            <span>Vai trò yêu cầu cho phân hệ này:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {allowedRoles.map((r) => (
              <span key={r} className="bg-blue-50 text-gov-blue border border-blue-200 px-2 py-0.5 rounded font-mono font-medium">
                {r}
              </span>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold">Tự động chuyển hướng an toàn:</span>
              <span className="font-mono font-bold text-gov-blue">{secondsLeft}s</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gov-blue h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(secondsLeft / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(fallbackPath, { replace: true })}
            className="gov-btn-primary w-full sm:w-auto px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{fallbackLabel} Ngay</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="gov-btn-secondary w-full sm:w-auto px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất & Đổi Tài Khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
}

UnauthorizedView.propTypes = {
  user: PropTypes.object,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  logout: PropTypes.func.isRequired,
};

/**
 * Cây Kế Thừa Phân Tầng Vai Trò (Hierarchical RBAC):
 * - ADMIN: Kế thừa toàn bộ quyền (ADMIN, OFFICER, CITIZEN)
 * - OFFICER: Kế thừa quyền Cán bộ + quyền Công dân (OFFICER, CITIZEN)
 * - CITIZEN: Chỉ có quyền cơ bản của Công dân (CITIZEN)
 */
export const ROLE_HIERARCHY = {
  ADMIN: ['ADMIN', 'OFFICER', 'CITIZEN'],
  OFFICER: ['OFFICER', 'CITIZEN'],
  CITIZEN: ['CITIZEN']
};

/**
 * Component bảo vệ các tuyến đường theo trạng thái đăng nhập và phân quyền RBAC kế thừa
 * 
 * @param {Object} props
 * @param {Array<string>} props.allowedRoles - Danh sách vai trò tối thiểu yêu cầu (ví dụ: ['OFFICER'])
 * @param {React.ReactNode} props.children
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  // 1. Đang kiểm tra token
  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 space-y-3">
        <div className="w-10 h-10 border-3 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-700">Đang kiểm tra quyền hạn hệ thống...</p>
      </div>
    );
  }

  // 2. Chưa đăng nhập -> Chuyển hướng sang /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Đã đăng nhập: Kiểm tra thẩm quyền qua Mô hình Kế thừa Phân tầng (Hierarchical RBAC)
  if (allowedRoles.length > 0) {
    const userRole = user?.role || 'CITIZEN';
    const allowed = ROLE_HIERARCHY[userRole] || [];
    const hasAccess = allowedRoles.some((role) => allowed.includes(role));

    if (!hasAccess) {
      // Nếu là Công dân cố tình truy cập /officer hoặc /admin -> tự động chuyển hướng thẳng về Cổng tiếp nhận ("/")
      if (userRole === 'CITIZEN') {
        return <Navigate to="/" replace />;
      }

      return (
        <UnauthorizedView 
          user={user} 
          allowedRoles={allowedRoles} 
          logout={logout} 
        />
      );
    }
  }

  // 4. Hợp lệ -> Cho phép truy cập
  return children;
}

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
};

