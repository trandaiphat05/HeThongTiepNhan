import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Menu, X, Search, Mail, Star, AlertTriangle, Clock, 
  CheckCircle2, FileText, Settings, LogOut, Plus, 
  User, ChevronDown, Landmark, History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { api } from '../../services/api';
import GmailSyncModal from '../../features/citizen/components/GmailSyncModal';

/**
 * Modern Gmail Standard App Shell
 * Conforms to Human Perspective - Zero AI Hype
 * - Top Bar (64px fixed): Hamburger, Logo ("Cổng Đơn Thư Đồng Nai"), Search bar, [Gmail] dot button, User Cluster dropdown
 * - Sidebar (~240px desktop, mobile drawer): [+ Gửi đơn mới] Compose button, rounded-r-full Nav list with counters
 */
export default function GmailAppShell({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // User Dropdown
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Gmail modal & status
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isGmailConnected, setIsGmailConnected] = useState(false);

  // Search input state
  const currentQuery = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(currentQuery);

  // Ticket counters for sidebar
  const [counts, setCounts] = useState({
    all: 0,
    priority: 0,
    manual: 0,
    processing: 0,
    approved: 0,
  });

  const userRole = user?.role || 'CITIZEN';
  const isOfficerOrAdmin = userRole === 'OFFICER' || userRole === 'ADMIN';
  const isAdmin = userRole === 'ADMIN';

  // Load Gmail connection status
  const checkGmailStatus = async () => {
    try {
      const res = await authService.getGmailStatus();
      setIsGmailConnected(Boolean(res?.is_linked));
    } catch {
      setIsGmailConnected(false);
    }
  };

  // Load ticket counts for sidebar badges
  const loadTicketCounts = async () => {
    if (!isAuthenticated || !isOfficerOrAdmin) return;
    try {
      const tickets = await api.getTickets();
      if (Array.isArray(tickets)) {
        setCounts({
          all: tickets.length,
          priority: tickets.filter(t => t.priority === 'CAO').length,
          manual: tickets.filter(t => t.dept_code === 'REQUIRE_HUMAN_REVIEW' || t.status === 'HUMAN_REVIEW' || t.ai_result?.is_fallback || t.ai_failed).length,
          processing: tickets.filter(t => t.status === 'ROUTED' || t.status === 'PROCESSING').length,
          approved: tickets.filter(t => t.status === 'APPROVED').length,
        });
      }
    } catch (e) {
      // Silently keep default counts
    }
  };

  useEffect(() => {
    checkGmailStatus();
    loadTicketCounts();
  }, [isAuthenticated, isOfficerOrAdmin]);

  // Sync search input if URL changes
  useEffect(() => {
    setSearchInput(searchParams.get('q') || searchParams.get('code') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (location.pathname === '/officer') {
      const newParams = new URLSearchParams(searchParams);
      if (query) newParams.set('q', query);
      else newParams.delete('q');
      setSearchParams(newParams);
    } else {
      // Khi ở chế độ Công dân: Gõ mã hồ sơ và nhấn Enter -> chuyển ngay sang màn hình Tra cứu mã hồ sơ
      if (query) {
        navigate(`/?tab=lookup&code=${encodeURIComponent(query)}`);
      } else {
        navigate('/?tab=lookup');
      }
    }
  };

  const handleComposeClick = (e) => {
    if (e) e.preventDefault();
    setMobileDrawerOpen(false);
    const isAlreadyOnSubmit = location.pathname === '/' && (searchParams.get('tab') === 'submit' || !searchParams.get('tab'));
    window.dispatchEvent(new CustomEvent('citizen-reset-submit-form'));
    if (!isAlreadyOnSubmit) {
      navigate('/?tab=submit');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = () => {
    setMobileDrawerOpen(false);
  };

  // Sidebar nav items definitions
  const currentTab = searchParams.get('tab') || 'all';

  const navItems = [
    {
      id: 'all',
      to: '/officer?tab=all',
      label: 'Tất cả đơn thư',
      icon: Mail,
      count: counts.all,
      isActive: location.pathname === '/officer' && currentTab === 'all',
      show: isOfficerOrAdmin,
    },
    {
      id: 'priority',
      to: '/officer?tab=priority',
      label: 'Khẩn cấp / Ưu tiên',
      icon: Star,
      count: counts.priority,
      badgeColor: 'bg-amber-100 text-amber-900',
      isActive: location.pathname === '/officer' && currentTab === 'priority',
      show: isOfficerOrAdmin,
    },
    {
      id: 'manual',
      to: '/officer?tab=manual',
      label: 'Cần xử lý thủ công',
      icon: AlertTriangle,
      count: counts.manual,
      badgeColor: 'bg-orange-100 text-orange-900',
      isActive: location.pathname === '/officer' && currentTab === 'manual',
      show: isOfficerOrAdmin,
    },
    {
      id: 'processing',
      to: '/officer?tab=processing',
      label: 'Đang thụ lý',
      icon: Clock,
      count: counts.processing,
      isActive: location.pathname === '/officer' && currentTab === 'processing',
      show: isOfficerOrAdmin,
    },
    {
      id: 'approved',
      to: '/officer?tab=approved',
      label: 'Đã ban hành',
      icon: CheckCircle2,
      count: counts.approved,
      isActive: location.pathname === '/officer' && currentTab === 'approved',
      show: isOfficerOrAdmin,
    },
  ].filter(item => item.show);

  // Avatar initial
  const avatarInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';

  const roleBadgeLabel = {
    ADMIN: 'Quản trị viên',
    OFFICER: 'Cán bộ thụ lý',
    CITIZEN: 'Công dân',
  }[userRole] || userRole;

  return (
    <div className="h-screen overflow-hidden bg-[#F6F8FC] flex flex-col font-sans text-[#1F1F1F]">
      
      {/* ===================== TOP BAR (64px fixed) ===================== */}
      <header className="h-16 fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between gap-3 shadow-2xs">
        
        {/* Left: Hamburger + Logo & System Name */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setMobileDrawerOpen(!mobileDrawerOpen);
            }}
            className="p-2 text-[#5F6368] hover:text-[#1F1F1F] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Mở/Thu gọn menu"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 hover:opacity-95 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-[#0B57D0] flex items-center justify-center text-white shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0B57D0]">
                UBND TỈNH ĐỒNG NAI
              </div>
              <h1 className="text-base font-bold text-[#1F1F1F] tracking-tight">
                Cổng Đơn Thư Đồng Nai
              </h1>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar rounded-full, bg #EAF1FB */}
        <div className="flex-1 max-w-2xl mx-2 sm:mx-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6368]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                location.pathname === '/officer'
                  ? "Tìm kiếm mã hồ sơ, người gửi, nội dung phản ánh..."
                  : "Nhập mã hồ sơ (ví dụ: ĐN-20261120-...) nhấn Enter để tra cứu tiến độ..."
              }
              className="w-full bg-[#EAF1FB] hover:bg-[#dfeaf9] focus:bg-white border border-transparent focus:border-[#0B57D0] rounded-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder-[#5F6368] focus:outline-none focus:shadow-md transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  if (location.pathname === '/officer') {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('q');
                    setSearchParams(newParams);
                  }
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1F1F1F] p-0.5 rounded-full"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Right: [Gmail] button (only for Officer & Admin) + User account cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* [Gmail] button with status indicator - Cán bộ & Quản trị viên */}
          {isOfficerOrAdmin && (
            <button
              type="button"
              onClick={() => setIsGmailModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF1FB] hover:bg-[#d8e7fc] text-[#0B57D0] text-xs font-semibold border border-blue-200 transition-colors shadow-2xs cursor-pointer"
              title={isGmailConnected ? 'Hòm thư Gmail: Đã kết nối' : 'Hòm thư Gmail: Chưa kết nối'}
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Gmail</span>
              {/* Status dot */}
              <span
                className={`w-2 h-2 rounded-full ${
                  isGmailConnected
                    ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
            </button>
          )}

          {/* User Account Cluster */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-8 h-8 rounded-full bg-[#0B57D0] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {avatarInitial}
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight pr-1">
                  <div className="font-semibold text-[#1F1F1F] max-w-[120px] truncate">
                    {user?.full_name || user?.username}
                  </div>
                  <div className="text-[10px] text-[#5F6368]">
                    {roleBadgeLabel}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#5F6368] hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] py-2 z-40 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-[#1F1F1F] truncate">
                        {user?.full_name}
                      </div>
                      <div className="text-[11px] text-[#5F6368] font-mono truncate">
                        {user?.username} ({roleBadgeLabel})
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-[#1F1F1F]"
                      >
                        <FileText className="w-4 h-4 text-[#5F6368]" />
                        <span>Cổng Gửi Đơn & Tra Cứu</span>
                      </Link>

                      {isOfficerOrAdmin && (
                        <Link
                          to="/officer"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-[#1F1F1F]"
                        >
                          <Mail className="w-4 h-4 text-[#0B57D0]" />
                          <span>Hộp Thư Xử Lý (Cán bộ)</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-[#1F1F1F]"
                        >
                          <Settings className="w-4 h-4 text-[#5F6368]" />
                          <span>Quản Trị & Kho Luật</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shadow-xs"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      {/* ===================== BODY WITH SIDEBAR & CONTENT ===================== */}
      <div className="flex flex-1 pt-16 h-[calc(100vh-4rem)] overflow-hidden">
        
        {/* SIDEBAR: Desktop ~240px & Mobile Drawer */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 pt-16 lg:pt-0
            w-60 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0
            h-full overflow-hidden
            transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'lg:block' : 'lg:hidden'}
            ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Top of Sidebar: Compose Button [+ Gửi đơn mới] (Chỉ hiển thị cho Công dân hoặc khi ở Trang chủ /) */}
          {(!isOfficerOrAdmin || location.pathname === '/') && (
            <div className="p-4 pb-3">
              <button
                type="button"
                onClick={handleComposeClick}
                className={`w-full font-semibold text-sm py-3 px-4 rounded-2xl shadow-xs transition-all flex items-center gap-3 cursor-pointer group ${
                  location.pathname === '/' && (searchParams.get('tab') === 'submit' || !searchParams.get('tab'))
                    ? 'bg-[#C2E7FF] text-[#001D35] ring-2 ring-[#0B57D0]/40 font-bold shadow-sm'
                    : 'bg-[#C2E7FF] hover:bg-[#b2defc] text-[#001D35] hover:shadow-sm'
                }`}
                title="Gửi đơn mới (Chuyển sang form hoặc xóa trắng để soạn mới)"
              >
                <Plus className="w-5 h-5 text-[#001D35] group-hover:rotate-90 transition-transform" />
                <span>Gửi đơn mới</span>
              </button>
            </div>
          )}

          {/* Navigation Items (rounded-r-full) */}
          <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 text-xs font-medium">
            
            {/* 1. Nếu là Cán bộ đang ở Hộp thư Cán bộ (/officer) */}
            {isOfficerOrAdmin && location.pathname === '/officer' ? (
              <>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.to}
                      onClick={handleNavClick}
                      className={() =>
                        `flex items-center justify-between px-4 py-2.5 rounded-r-full transition-colors ${
                          item.isActive
                            ? 'bg-[#D3E3FD] font-bold text-[#041E49]'
                            : 'text-[#1F1F1F] hover:bg-[#F2F6FC]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${item.isActive ? 'text-[#041E49]' : 'text-[#5F6368]'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {typeof item.count === 'number' && item.count > 0 && (
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ml-1.5 ${
                            item.badgeColor || (item.isActive ? 'bg-[#041E49] text-white' : 'bg-slate-200 text-[#1F1F1F]')
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </NavLink>
                  );
                })}

                <div className="my-2 border-t border-[#E2E8F0]" />

                {/* Chuyển sang Cổng dịch vụ công dân */}
                <NavLink
                  to="/"
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-r-full text-[#1F1F1F] hover:bg-[#F2F6FC] transition-colors"
                >
                  <Landmark className="w-4 h-4 text-[#5F6368]" />
                  <span>Cổng nộp & tra cứu đơn</span>
                </NavLink>

                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-r-full text-[#1F1F1F] hover:bg-[#F2F6FC] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#5F6368]" />
                    <span>Quản trị & Kho luật</span>
                  </NavLink>
                )}
              </>
            ) : (
              /* 2. Cổng Công Dân: Menu tinh gọn đúng 2 mục dưới nút Gửi Đơn Mới (Không còn Cổng nộp phản ánh) */
              <>
                {/* Mục 1: Tra cứu mã hồ sơ */}
                <Link
                  to="/?tab=lookup"
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-r-full transition-colors cursor-pointer ${
                    location.pathname === '/tracking' || (location.pathname === '/' && (searchParams.get('tab') === 'lookup' || searchParams.get('tab') === 'track'))
                      ? 'bg-[#D3E3FD] font-bold text-[#041E49]'
                      : 'text-[#1F1F1F] hover:bg-[#F2F6FC]'
                  }`}
                >
                  <Search className={`w-4 h-4 shrink-0 ${(location.pathname === '/tracking' || (location.pathname === '/' && (searchParams.get('tab') === 'lookup' || searchParams.get('tab') === 'track'))) ? 'text-[#041E49]' : 'text-[#5F6368]'}`} />
                  <span>Tra cứu mã hồ sơ</span>
                </Link>

                {/* Mục 2: Lịch sử đơn của tôi */}
                <Link
                  to="/?tab=history"
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-r-full transition-colors cursor-pointer ${
                    location.pathname === '/' && searchParams.get('tab') === 'history'
                      ? 'bg-[#D3E3FD] font-bold text-[#041E49]'
                      : 'text-[#1F1F1F] hover:bg-[#F2F6FC]'
                  }`}
                >
                  <History className={`w-4 h-4 shrink-0 ${location.pathname === '/' && searchParams.get('tab') === 'history' ? 'text-[#041E49]' : 'text-[#5F6368]'}`} />
                  <span>Lịch sử đơn của tôi</span>
                </Link>

                {/* Phím tắt quay lại cho Cán bộ / Admin nếu đang xem màn hình Công dân */}
                {isOfficerOrAdmin && (
                  <>
                    <div className="my-2 border-t border-[#E2E8F0]" />
                    <NavLink
                      to="/officer"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-r-full text-[#1F1F1F] hover:bg-[#F2F6FC] transition-colors"
                    >
                      <Mail className="w-4 h-4 text-[#0B57D0]" />
                      <span>Hộp thư cán bộ</span>
                    </NavLink>

                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={handleNavClick}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-r-full text-[#1F1F1F] hover:bg-[#F2F6FC] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#5F6368]" />
                        <span>Quản trị hệ thống</span>
                      </NavLink>
                    )}
                  </>
                )}
              </>
            )}
          </nav>

          {/* Footer note */}
          <div className="p-3 border-t border-[#E2E8F0] text-[11px] text-[#5F6368] text-center">
            Hệ thống Tiếp nhận Đơn thư
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
            onClick={() => setMobileDrawerOpen(false)}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#F6F8FC] p-3 sm:p-5 h-full">
          {children}
        </main>
      </div>

      {/* Gmail Sync Modal (Opens when [Gmail] button clicked) */}
      <GmailSyncModal
        isOpen={isGmailModalOpen}
        onClose={() => {
          setIsGmailModalOpen(false);
          checkGmailStatus();
          loadTicketCounts();
        }}
        onSyncComplete={() => {
          loadTicketCounts();
        }}
      />
    </div>
  );
}

GmailAppShell.propTypes = {
  children: PropTypes.node.isRequired,
};
