import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Landmark, User, Lock, Eye, EyeOff, LogIn, AlertCircle, 
  ShieldCheck, ArrowRight, Shield, Briefcase, UserPlus,
  Building2, Trees, Siren, Car, HeartPulse, GraduationCap, HeartHandshake
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Khối Quốc hiệu & Tiêu đề Hành chính */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-2.5">
        {/* Huy hiệu tỉnh Đồng Nai */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-xs flex items-center justify-center mx-auto">
          <div className="w-13 h-13 rounded-full bg-[#1E3A8A] flex flex-col items-center justify-center text-center border border-amber-300">
            <Landmark className="w-5 h-5 text-amber-300" />
            <span className="text-[9px] font-bold tracking-tighter text-amber-200 leading-none mt-0.5">ĐỒNG NAI</span>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold tracking-wider text-[#991B1B] uppercase block mb-1">
            Ủy Ban Nhân Dân Tỉnh Đồng Nai
          </span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase">
            Cổng Thông Tin Tiếp Nhận & Điều Phối Đơn Thư
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Hệ thống xác thực tập trung dành cho Cán bộ Một cửa, Chuyên viên thẩm định và Công dân
          </p>
        </div>
      </div>

      {/* Thẻ Form Đăng Nhập Chuẩn Hành Chính */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-7 px-6 sm:px-8 shadow-xs border border-[#E2E8F0] rounded-lg space-y-5">
          
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
                  placeholder="admin / canbo_gtvt / canbo_tnmt / canbo_soxd / canbo_congan / congdan1"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all"
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
                  className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all"
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
              className="w-full bg-[#1E3A8A] hover:bg-[#172554] active:bg-[#0f172a] text-white font-bold py-2.5 px-4 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-800 text-xs">
                Chưa có tài khoản công dân?
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Đăng ký tài khoản để nộp phản ánh trực tuyến và nhận thông báo tiến độ qua email cá nhân.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md text-xs font-semibold shadow-2xs transition-colors shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-500" />
              <span>Đăng ký tài khoản</span>
            </Link>
          </div>

          {/* ===================== TÀI KHOẢN KIỂM THỬ HỆ THỐNG ===================== */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
                TÀI KHOẢN KIỂM THỬ HỆ THỐNG
              </span>
              <span className="text-[11px] text-slate-400">Bấm chọn để đăng nhập nhanh</span>
            </div>

            {/* Nhóm 1: Cán bộ các Sở / Ban / Ngành & Đơn vị phụ trách */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-slate-400" />
                <span>1. Cán bộ các Sở / Ban / Ngành nghiệp vụ (Role: OFFICER)</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Sở GTVT */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('canbo_gtvt', 'officer123', '/officer')}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-700 bg-white hover:bg-blue-50/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  title="Đăng nhập Cán bộ Sở Giao thông Vận tải"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Sở GTVT <span className="font-mono text-[10px] font-normal text-slate-400">(canbo_gtvt)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Cầu đường, sụt lún, xe buýt, phân luồng
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                </button>

                {/* 2. Sở TN&MT */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('canbo_tnmt', 'officer123', '/officer')}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-700 bg-white hover:bg-emerald-50/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  title="Đăng nhập Cán bộ Sở Tài nguyên & Môi trường"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Trees className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Sở TN&MT <span className="font-mono text-[10px] font-normal text-slate-400">(canbo_tnmt)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Ranh đất, xả thải ô nhiễm, khoáng sản
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                </button>

                {/* 3. Sở Xây dựng */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('canbo_xaydung', 'officer123', '/officer')}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-amber-700 bg-white hover:bg-amber-50/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  title="Đăng nhập Cán bộ Sở Xây dựng"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Sở Xây dựng <span className="font-mono text-[10px] font-normal text-slate-400">(canbo_xaydung)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Trật tự xây dựng, quy hoạch, nứt lún
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                </button>

                {/* 4. Sở Y tế */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('canbo_yte', 'officer123', '/officer')}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-rose-700 bg-white hover:bg-rose-50/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  title="Đăng nhập Cán bộ Sở Y tế"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Sở Y tế <span className="font-mono text-[10px] font-normal text-slate-400">(canbo_yte)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Bệnh viện, phòng khám, ATTP, dịch bệnh
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                </button>

                {/* 5. Sở Giáo dục & Đào tạo */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('canbo_gddt', 'officer123', '/officer')}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-700 bg-white hover:bg-indigo-50/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  title="Đăng nhập Cán bộ Sở Giáo dục & Đào tạo"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Sở GD&ĐT <span className="font-mono text-[10px] font-normal text-slate-400">(canbo_gddt)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Trường học, tuyển sinh, học phí, bạo lực
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                </button>

                {/* 6. Sở Lao động - Thương binh & Xã hội */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('canbo_ldtbxh', 'officer123', '/officer')}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-teal-700 bg-white hover:bg-teal-50/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  title="Đăng nhập Cán bộ Sở Lao động - Thương binh & Xã hội"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Sở LĐ-TB&XH <span className="font-mono text-[10px] font-normal text-slate-400">(canbo_ldtbxh)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Chậm lương, nợ BHXH, bảo hiểm thất nghiệp
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                </button>

                {/* 7. Công an Tỉnh */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('canbo_congan', 'officer123', '/officer')}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-red-700 bg-white hover:bg-red-50/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  title="Đăng nhập Cán bộ Công an Tỉnh Đồng Nai"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
                      <Siren className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Công an Tỉnh <span className="font-mono text-[10px] font-normal text-slate-400">(canbo_congan)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        An ninh trật tự, trộm cắp, đua xe, tiếng ồn
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                </button>

                {/* 8. Cán bộ Một cửa / UBND Cấp Huyện */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('canbo_motcua', 'officer123', '/officer')}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-purple-700 bg-white hover:bg-purple-50/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  title="Đăng nhập Cán bộ Bộ phận Một cửa / UBND Cấp Huyện"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Bộ phận Một cửa <span className="font-mono text-[10px] font-normal text-slate-400">(canbo_motcua)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Tiếp nhận quầy, thẩm tra ban đầu, UBND Huyện
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                </button>
              </div>
            </div>

            {/* Nhóm 2: Quản trị viên & Công dân */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                <span>2. Phân hệ Quản trị hệ thống & Cổng Công dân</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Quản trị hệ thống */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123', '/admin')}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-700 bg-white hover:bg-blue-50/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  title="Đăng nhập Quản trị viên Hệ thống"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Quản trị hệ thống <span className="font-mono text-[10px] font-normal text-slate-400">(admin)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Điều phối ngoại lệ, phê duyệt tài khoản & KPI
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                </button>

                {/* Công dân */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('congdan1', 'citizen123', '/')}
                  disabled={loading}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-700 bg-white hover:bg-blue-50/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  title="Đăng nhập Công dân nộp đơn trực tuyến"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Tài khoản Công dân <span className="font-mono text-[10px] font-normal text-slate-400">(congdan1)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Nộp đơn trực tuyến & Tra cứu hồ sơ
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                </button>
              </div>
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
