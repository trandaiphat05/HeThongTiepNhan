import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  Landmark, PhoneCall, FileText, Briefcase, Settings, 
  LogOut, LogIn, User, Mail, ShieldCheck, Shield 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GmailSyncModal from '../features/citizen/components/GmailSyncModal';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);

  // Phân cấp thẩm quyền Kế thừa (Hierarchical RBAC):
  // - CITIZEN: Xem Cổng Công dân
  // - OFFICER: Xem Cổng Công dân + Bàn làm việc Cán bộ
  // - ADMIN: Xem tất cả (Cổng Công dân + Bàn làm việc Cán bộ + Quản trị Hệ thống)
  const userRole = user?.role || 'CITIZEN';
  const isOfficerOrAdmin = userRole === 'OFFICER' || userRole === 'ADMIN';
  const isAdmin = userRole === 'ADMIN';

  const visibleNavItems = [
    { to: '/', label: 'Cổng Tiếp Nhận', icon: FileText, show: true },
    { to: '/officer', label: 'Bàn Làm Việc', icon: Briefcase, show: isAuthenticated && isOfficerOrAdmin },
    { to: '/admin', label: 'Quản Trị', icon: Settings, show: isAuthenticated && isAdmin },
  ].filter((item) => item.show);

  // Render badge vai trò theo chuẩn thiết kế
  const renderRoleBadge = (role, deptCode) => {
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs border border-red-400 whitespace-nowrap">
          <Shield className="w-2.5 h-2.5" />
          <span>Quản trị viên Hệ thống</span>
        </span>
      );
    }
    if (role === 'OFFICER') {
      const deptNameMap = {
        SO_GTVT: 'Sở GTVT',
        SO_TNMT: 'Sở TN&MT',
        SO_XD: 'Sở XD',
        SO_XAYDUNG: 'Sở XD',
        SO_YTE: 'Sở Y tế',
        SO_YT: 'Sở Y tế',
        SO_GDDT: 'Sở GD&ĐT',
        SO_GD: 'Sở GD&ĐT',
        SO_LDTBXH: 'Sở LĐ-TB&XH',
        SO_LD: 'Sở LĐ-TB&XH',
        CONG_AN_TINH: 'Công an Tỉnh',
        UBND_CAP_HUYEN: 'UBND Huyện/TP',
        UBND_TINH: 'UBND Tỉnh',
      };
      const deptDisplay = deptNameMap[deptCode] || deptCode || 'Chuyên viên';
      return (
        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs border border-emerald-400">
          <span>Cán bộ - {deptDisplay}</span>
        </span>
      );
    }
    // CITIZEN
    return (
      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-bold text-[10px] px-2 py-0.5 rounded border border-slate-300">
        <span>Công dân</span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-gov-blue text-white shadow-xs border-b-2 border-amber-500">
      {/* Thanh thông tin cấp trên (Top bar) */}
      <div className="bg-gov-blue-dark py-1.5 px-4 sm:px-8 border-b border-blue-900/40 text-xs sm:text-sm">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="font-semibold text-gov-gold uppercase tracking-wider">Cổng Thông Tin Hành Chính Điện Tử</span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline">Tỉnh Đồng Nai, Việt Nam</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-gov-gold" />
              <span>Đường dây nóng: <strong className="text-white font-bold">1022</strong> hoặc <strong className="text-white">0251.1022</strong></span>
            </div>
            <span className="inline-flex items-center gap-1 bg-blue-900/80 px-2 py-0.5 rounded text-[11px] text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Cổng Tiếp Nhận 24/7
            </span>
          </div>
        </div>
      </div>

      {/* Tiêu đề Quốc hiệu Hành chính & Menu Điều Hướng */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo và Tiêu đề có link về trang chủ */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity shrink-0">
          {/* Huy hiệu tỉnh Đồng Nai */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-10 h-10 rounded-full bg-gov-blue-dark flex flex-col items-center justify-center text-center border border-amber-300">
              <Landmark className="w-4 h-4 text-gov-gold" />
              <span className="text-[8px] font-bold tracking-tighter text-amber-200 leading-none mt-0.5">ĐỒNG NAI</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-wider text-amber-300 uppercase">
              Ủy Ban Nhân Dân Tỉnh Đồng Nai
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
              Hệ Thống Tiếp Nhận & Điều Phối Đơn Thư
            </h1>
          </div>
        </Link>

        {/* Khu vực Điều Hướng & Tài Khoản Người Dùng */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0 flex-nowrap">
          {/* Thanh Điều Hướng Các Trang Chính */}
          <nav className="flex items-center gap-1.5 bg-blue-950/60 p-1.5 rounded-lg border border-blue-800/80 shrink-0">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm transition-all text-left whitespace-nowrap ${
                      isActive
                        ? 'bg-gov-gold text-slate-900 shadow-sm font-bold ring-1 ring-amber-300'
                        : 'text-slate-200 hover:bg-blue-900/60 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Nút Đồng Bộ Hòm Thư: Chỉ hiển thị cho Quản trị viên (ADMIN) và Cán bộ (OFFICER) */}
          {isAuthenticated && isOfficerOrAdmin && (
            <button
              type="button"
              onClick={() => setIsGmailModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-900/80 hover:bg-blue-800 text-amber-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-blue-700/80 transition-colors cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
              title={isAdmin 
                ? "Đồng bộ hòm thư tiếp nhận đơn thư tập trung của tỉnh (tiepnhandonthu@dongnai.gov.vn)" 
                : "Đồng bộ hòm thư xử lý nghiệp vụ của sở/ban ngành phụ trách"}
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Đồng Bộ Hòm Thư</span>
            </button>
          )}

          {/* Phần Người Dùng & Nút Đăng Xuất */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-blue-950/80 p-1.5 rounded-lg border border-blue-800/80 shrink-0">
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  {user?.full_name?.charAt(0) || <User className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-semibold text-white truncate max-w-[150px]">
                    {user?.full_name}
                  </div>
                  <div className="mt-1">
                    {renderRoleBadge(user?.role, user?.department_code || user?.dept_code)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="bg-rose-900/80 hover:bg-rose-800 text-rose-200 hover:text-white px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 border border-rose-700/60 transition-colors cursor-pointer shrink-0"
                title="Đăng xuất tài khoản"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-gov-gold hover:bg-amber-400 text-slate-900 font-bold px-3.5 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* Modal Đồng Bộ Gmail Thật */}
      <GmailSyncModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
      />
    </header>
  );
}
