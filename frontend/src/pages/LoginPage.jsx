import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Landmark, User, Lock, Eye, EyeOff, LogIn, AlertCircle, 
  ShieldCheck, Shield, Car, UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Trang Đăng Nhập - Cổng Thông Tin Tiếp Nhận & Điều Phối Đơn Thư
 * Phong cách Cổng Dịch Vụ Công Quốc Gia / Hành Chính Công Chuẩn Mực
 */
export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState(location.state?.prefilledUsername || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Điều hướng người dùng dựa theo phân quyền
  const redirectBasedOnRole = (role) => {
    // 1. Nếu là CÔNG DÂN (CITIZEN), tuyệt đối chỉ điều hướng về Cổng Tiếp Nhận ("/")
    if (role === 'CITIZEN' || (!role || (role !== 'ADMIN' && role !== 'OFFICER'))) {
      navigate('/', { replace: true });
      return;
    }

    // 2. Đối với Cán bộ hoặc Quản trị viên, kiểm tra nếu có trang đích trước đó
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }

    if (role === 'ADMIN') {
      navigate('/admin', { replace: true });
    } else if (role === 'OFFICER') {
      navigate('/officer', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // Tự động chuyển trang nếu đã có phiên đăng nhập hợp lệ
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      if (user.role === 'CITIZEN') {
        navigate('/', { replace: true });
      } else {
        redirectBasedOnRole(user.role);
      }
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(username.trim(), password);
      if (loggedUser.role === 'CITIZEN' || username.trim() === 'congdan1') {
        navigate('/', { replace: true });
      } else {
        redirectBasedOnRole(loggedUser.role);
      }
    } catch (err) {
      console.error('Đăng nhập thất bại:', err);
      setErrorMessage(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập nhanh phục vụ nghiệm thu / kiểm thử hệ thống
  const handleQuickLogin = async (u, p, targetPath) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
    setLoading(true);

    try {
      const loggedUser = await login(u, p);
      if (loggedUser.role === 'CITIZEN' || u === 'congdan1') {
        navigate('/', { replace: true });
      } else if (targetPath) {
        navigate(targetPath, { replace: true });
      } else {
        redirectBasedOnRole(loggedUser.role);
      }
    } catch (err) {
      console.error('Lỗi đăng nhập kiểm thử:', err);
      setErrorMessage(err.message || 'Không thể đăng nhập bằng tài khoản mẫu này.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Khối Quốc hiệu & Tiêu đề Hành chính */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2.5">
        {/* Huy hiệu tỉnh Đồng Nai */}
        <div className="w-12 h-12 rounded-2xl bg-[#0B57D0] flex items-center justify-center text-white shadow-xs mx-auto">
          <Landmark className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[11px] font-semibold tracking-wider text-[#0B57D0] uppercase block mb-0.5">
            Ủy Ban Nhân Dân Tỉnh Đồng Nai
          </span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1F1F1F]">
            Cổng Đơn Thư Đồng Nai
          </h1>
          <p className="text-xs text-[#5F6368] mt-1 max-w-md mx-auto leading-relaxed">
            Hệ thống Tiếp nhận & Điều phối Đơn thư Trực tuyến
          </p>
        </div>
      </div>

      {/* Thẻ Form Đăng Nhập Chuẩn Google-Style */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-7 px-6 sm:px-8 shadow-md border border-[#E2E8F0] rounded-2xl space-y-5">
          
          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className={`p-3.5 rounded-lg flex items-start gap-2.5 text-xs ${
              errorMessage.includes('chờ Quản trị viên') || errorMessage.includes('quyền truy cập')
                ? 'bg-amber-50 border border-amber-300 text-amber-900'
                : 'bg-rose-50 border-l-3 border-[#991B1B] text-rose-800'
            }`}>
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                errorMessage.includes('chờ Quản trị viên') ? 'text-amber-700' : 'text-[#991B1B]'
              }`} />
              <div className="leading-relaxed">
                <span className="font-semibold block">{errorMessage}</span>
                {errorMessage.includes('chờ Quản trị viên') && (
                  <span className="text-[11px] text-amber-700 block mt-0.5">
                    Vui lòng liên hệ Văn phòng UBND tỉnh hoặc chờ Quản trị viên phê duyệt hồ sơ công vụ.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Form đăng nhập */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Tên đăng nhập hoặc Email:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tên đăng nhập hoặc địa chỉ email..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B57D0] focus:border-transparent transition-all"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Mật khẩu đăng nhập:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B57D0] focus:border-transparent transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold py-2.5 px-4 rounded-full shadow-xs transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xác thực thông tin...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Hệ Thống</span>
                </>
              )}
            </button>
          </form>

          {/* ===================== KHU VỰC ĐĂNG KÝ TÀI KHOẢN MỚI ===================== */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-800 text-xs">
                Chưa có tài khoản công dân?
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Đăng ký tài khoản để nộp phản ánh trực tuyến và nhận kết quả qua email.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-full text-xs font-semibold shadow-2xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                <span>Đăng ký</span>
              </Link>
              <Link
                to="/?tab=lookup"
                className="text-xs font-semibold text-[#0B57D0] hover:underline px-2"
              >
                Tra cứu hồ sơ
              </Link>
            </div>
          </div>

          {/* ===================== TÀI KHOẢN KIỂM THỬ HỆ THỐNG (DEMO CHUẨN GMAIL) ===================== */}
          <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0B57D0]" />
                ĐĂNG NHẬP NHANH (BẢN DEMO)
              </span>
              <span className="text-[11px] text-slate-400">Chọn vai trò mẫu</span>
            </div>

            {/* 3 nút demo đại diện 3 vai trò chính */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('congdan1', 'citizen123', '/')}
                disabled={loading}
                className="p-2 rounded-xl border border-slate-200 hover:border-[#0B57D0] bg-slate-50 hover:bg-blue-50/50 text-center transition-all cursor-pointer shadow-2xs group"
                title="Đăng nhập tài khoản Công dân mẫu"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0B57D0] flex items-center justify-center mx-auto mb-1">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-[#0B57D0]">Công Dân</div>
                <div className="text-[10px] text-slate-400 font-mono">congdan1</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('canbo_gtvt', 'officer123', '/officer')}
                disabled={loading}
                className="p-2 rounded-xl border border-slate-200 hover:border-[#0B57D0] bg-slate-50 hover:bg-emerald-50/50 text-center transition-all cursor-pointer shadow-2xs group"
                title="Đăng nhập tài khoản Cán bộ Sở Giao thông Vận tải"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-1">
                  <Car className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Cán Bộ GTVT</div>
                <div className="text-[10px] text-slate-400 font-mono">canbo_gtvt</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123', '/admin')}
                disabled={loading}
                className="p-2 rounded-xl border border-slate-200 hover:border-[#0B57D0] bg-slate-50 hover:bg-purple-50/50 text-center transition-all cursor-pointer shadow-2xs group"
                title="Đăng nhập tài khoản Quản trị viên Toàn tỉnh"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-1">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Quản Trị Viên</div>
                <div className="text-[10px] text-slate-400 font-mono">admin</div>
              </button>
            </div>

            {/* Dropdown chọn các Sở khác khi cần kiểm thử chuyên sâu */}
            <div className="pt-0.5">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    handleQuickLogin(val, 'officer123', '/officer');
                  }
                }}
                defaultValue=""
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 hover:border-[#0B57D0] rounded-xl px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-[#0B57D0] transition-colors cursor-pointer"
              >
                <option value="" disabled>-- Kiểm thử các Sở/Ban/Ngành khác --</option>
                <option value="canbo_tnmt">Sở Tài nguyên & Môi trường (canbo_tnmt)</option>
                <option value="canbo_xaydung">Sở Xây dựng (canbo_xaydung)</option>
                <option value="canbo_yte">Sở Y tế (canbo_yte)</option>
                <option value="canbo_gddt">Sở Giáo dục & Đào tạo (canbo_gddt)</option>
                <option value="canbo_ldtbxh">Sở Lao động - Thương binh & Xã hội (canbo_ldtbxh)</option>
                <option value="canbo_congan">Công an Tỉnh Đồng Nai (canbo_congan)</option>
                <option value="canbo_motcua">Ban Tiếp công dân Tỉnh (canbo_motcua)</option>
              </select>
            </div>
          </div>

          {/* Dòng bảo mật chân trang */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Hệ thống bảo mật xác thực tập trung • Tỉnh Đồng Nai</span>
          </div>

        </div>
      </div>
    </div>
  );
}
