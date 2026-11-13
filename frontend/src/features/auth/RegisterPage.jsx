import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Landmark, User, Lock, Mail, Eye, EyeOff, UserPlus, 
  CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Building2,
  Phone, Briefcase, Clock, Shield
} from 'lucide-react';
import { authService } from '../../services/authService';

/**
 * Trang Đăng Ký Tài Khoản - Cổng Dịch Vụ Công & Phân Hệ Cán Bộ Tỉnh Đồng Nai
 * Phân luồng:
 * 1. Tài khoản Công dân: Họ tên, Email cá nhân, Số điện thoại, Mật khẩu -> Kích hoạt ngay lập tức.
 * 2. Tài khoản Cán bộ: Họ tên, Email công vụ (@dongnai.gov.vn), Mã số cán bộ, Đơn vị công tác, Mật khẩu -> Chờ Quản trị viên duyệt.
 */
export default function RegisterPage() {
  const navigate = useNavigate();

  // Tab chọn loại tài khoản: 'CITIZEN' | 'OFFICER'
  const [activeTab, setActiveTab] = useState('CITIZEN');

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    officer_code: '',
    dept_code: 'SO_GTVT',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successResult, setSuccessResult] = useState(null); // { type: 'CITIZEN' | 'OFFICER', user, message }

  const departments = [
    { code: 'SO_GTVT', name: 'Sở Giao thông Vận tải' },
    { code: 'SO_TNMT', name: 'Sở Tài nguyên & Môi trường' },
    { code: 'SO_XD', name: 'Sở Xây dựng' },
    { code: 'CONG_AN_TINH', name: 'Công an Tỉnh Đồng Nai' },
    { code: 'UBND_CAP_HUYEN', name: 'UBND Cấp Huyện / TP' },
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Kiểm tra chung
    if (!formData.full_name.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên đầy đủ.');
      return;
    }
    if (!formData.username.trim() || formData.username.trim().length < 3) {
      setErrorMessage('Tên đăng nhập phải có tối thiểu 3 ký tự.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMessage('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Mật khẩu và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    // 2. Kiểm tra theo từng loại tài khoản
    if (activeTab === 'CITIZEN') {
      if (!formData.email.trim()) {
        setErrorMessage('Vui lòng nhập địa chỉ Email cá nhân để nhận thông báo.');
        return;
      }
      if (!formData.phone.trim()) {
        setErrorMessage('Vui lòng nhập số điện thoại liên hệ của công dân.');
        return;
      }
    } else if (activeTab === 'OFFICER') {
      const emailLower = formData.email.trim().toLowerCase();
      if (!emailLower) {
        setErrorMessage('Vui lòng nhập địa chỉ Email công vụ.');
        return;
      }
      if (!emailLower.endsWith('@dongnai.gov.vn') && !emailLower.includes('@dongnai.gov.vn')) {
        setErrorMessage('Đăng ký tài khoản Cán bộ bắt buộc phải sử dụng email công vụ (@dongnai.gov.vn).');
        return;
      }
      if (!formData.officer_code.trim()) {
        setErrorMessage('Vui lòng nhập Mã số cán bộ / Số thẻ công chức.');
        return;
      }
      if (!formData.dept_code) {
        setErrorMessage('Vui lòng chọn Đơn vị công tác trực thuộc.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim(),
        role: activeTab,
        password: formData.password,
        phone: activeTab === 'CITIZEN' ? formData.phone.trim() : null,
        officer_code: activeTab === 'OFFICER' ? formData.officer_code.trim() : null,
        dept_code: activeTab === 'OFFICER' ? formData.dept_code : null,
      };

      const res = await authService.register(payload);
      setSuccessResult({
        type: activeTab,
        user: res?.user || payload,
        message: res?.message || (activeTab === 'OFFICER' 
          ? 'Yêu cầu đăng ký tài khoản Cán bộ đã được ghi nhận và đang chờ Quản trị viên phê duyệt.' 
          : 'Đăng ký tài khoản thành công!')
      });
    } catch (err) {
      console.error('Lỗi đăng ký tài khoản:', err);
      setErrorMessage(err.message || 'Đăng ký tài khoản không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // ===================== MÀN HÌNH HOÀN TẤT ĐĂNG KÝ =====================
  if (successResult) {
    const isOfficer = successResult.type === 'OFFICER';
    const deptInfo = departments.find(d => d.code === successResult.user.dept_code)?.name || successResult.user.dept_code;

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6 sm:p-8 text-center space-y-5">
            {isOfficer ? (
              // Trạng thái Cán bộ: Chờ Quản trị viên duyệt
              <>
                <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Chờ Quản Trị Viên Phê Duyệt
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Yêu Cầu Đăng Ký Đã Được Ghi Nhận
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    Yêu cầu đăng ký tài khoản Cán bộ đã được ghi nhận và đang chờ Quản trị viên phê duyệt.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-left text-xs space-y-1.5 text-slate-700">
                  <div>• Cán bộ đăng ký: <strong className="text-slate-900">{successResult.user.full_name}</strong></div>
                  <div>• Mã số cán bộ: <strong className="font-mono text-gov-blue">{successResult.user.officer_code}</strong></div>
                  <div>• Email công vụ: <strong className="font-mono text-slate-800">{successResult.user.email}</strong></div>
                  <div>• Đơn vị công tác: <strong>{deptInfo}</strong></div>
                  <div>• Tên đăng nhập: <strong className="font-mono text-gov-blue">{successResult.user.username}</strong></div>
                  <div className="pt-1 text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded border border-amber-200">
                    * Lưu ý: Tài khoản đang chờ Quản trị viên xác nhận quyền truy cập trước khi có thể đăng nhập vào Bàn làm việc cán bộ.
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link
                    to="/login"
                    className="flex-1 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-lg shadow-xs transition-colors text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Về Trang Đăng Nhập</span>
                  </Link>
                  <Link
                    to="/"
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-lg border border-slate-300 transition-colors text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Trang Chủ</span>
                  </Link>
                </div>
              </>
            ) : (
              // Trạng thái Công dân: Kích hoạt ngay lập tức
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Đã Kích Hoạt Tức Thì
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Đăng Ký Tài Khoản Thành Công!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    Tài khoản của Ông/Bà <strong>{successResult.user.full_name}</strong> đã được kích hoạt ngay lập tức trên hệ thống.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-left text-xs space-y-1.5 text-slate-700 font-mono">
                  <div>• Tên đăng nhập: <strong className="text-gov-blue">{successResult.user.username}</strong></div>
                  <div>• Email nhận thông báo: <strong>{successResult.user.email}</strong></div>
                  {successResult.user.phone && <div>• Số điện thoại: <strong>{successResult.user.phone}</strong></div>}
                  <div>• Quyền hạn: <strong className="text-emerald-700 font-sans">Công dân (Nộp & Tra cứu hồ sơ)</strong></div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { prefilledUsername: successResult.user.username } })}
                    className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Đăng Nhập Ngay Để Nộp & Tra Cứu Đơn</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===================== FORM ĐĂNG KÝ CHÍNH =====================
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Tiêu đề Cổng Thông Tin */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center space-y-2.5">
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
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống đăng ký tài khoản tập trung cho Công dân và Cán bộ chuyên trách
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-6 px-6 sm:px-8 shadow-xs border border-[#E2E8F0] rounded-lg space-y-5">
          
          {/* Header & Nút quay lại */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <UserPlus className="w-4 h-4 text-gov-blue" />
              <span>Đăng Ký Tài Khoản Mới</span>
            </div>
            <Link
              to="/login"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>

          {/* TAB CHỌN LOẠI TÀI KHOẢN (Công dân vs Cán bộ) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chọn Loại Tài Khoản Cần Đăng Ký:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => handleTabChange('CITIZEN')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'CITIZEN'
                    ? 'bg-white text-gov-blue shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Tài Khoản Công Dân</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('OFFICER')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'OFFICER'
                    ? 'bg-white text-gov-blue shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Tài Khoản Cán Bộ</span>
              </button>
            </div>
            
            <p className="text-[11px] text-slate-500 pt-0.5">
              {activeTab === 'CITIZEN' 
                ? '• Tài khoản Công dân được kích hoạt tức thì để nộp đơn trực tuyến và tra cứu tiến độ.'
                : '• Tài khoản Cán bộ yêu cầu email công vụ @dongnai.gov.vn và sẽ được Quản trị viên thẩm định phê duyệt.'}
            </p>
          </div>

          {/* Banner Thông báo Lỗi nếu có */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-lg text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Họ và tên đầy đủ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {activeTab === 'OFFICER' ? 'Họ và tên Cán bộ' : 'Họ và tên đầy đủ'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder={activeTab === 'OFFICER' ? 'Ví dụ: Lê Văn Bình' : 'Ví dụ: Nguyễn Văn An'}
                  required
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* PHẦN DÀNH RIÊNG CHO CÔNG DÂN: Số điện thoại + Email cá nhân */}
            {activeTab === 'CITIZEN' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số điện thoại liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0912 345 678"
                        required
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email cá nhân nhận kết quả <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="congdan@gmail.com"
                        required
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* PHẦN DÀNH RIÊNG CHO CÁN BỘ: Email công vụ, Mã số cán bộ & Đơn vị công tác */}
            {activeTab === 'OFFICER' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email công vụ tỉnh Đồng Nai <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="canbo.gtvt@dongnai.gov.vn"
                      required
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <span className="text-[11px] text-gov-blue mt-1 block">
                    * Bắt buộc có phần mở rộng: <strong>@dongnai.gov.vn</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mã số cán bộ / Số thẻ công chức <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="officer_code"
                        value={formData.officer_code}
                        onChange={handleChange}
                        placeholder="CB-GTVT-01"
                        required
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Đơn vị công tác trực thuộc <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="dept_code"
                        value={formData.dept_code}
                        onChange={handleChange}
                        className="block w-full py-2 px-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      >
                        {departments.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tên đăng nhập */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên đăng nhập hệ thống <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                  @
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={activeTab === 'OFFICER' ? 'canbo_gtvt01 (viết liền)' : 'nguyenvanan (viết liền)'}
                  required
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    className="block w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xác nhận lại mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="block w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {formData.confirmPassword && (
              <div className="text-[11px] flex items-center gap-1">
                {formData.password === formData.confirmPassword ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Mật khẩu khớp hoàn toàn
                  </span>
                ) : (
                  <span className="text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Mật khẩu chưa trùng khớp
                  </span>
                )}
              </div>
            )}

            {/* Nút bấm Đăng Ký */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang Gửi Yêu Cầu...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {activeTab === 'OFFICER' ? 'Gửi Yêu Cầu Đăng Ký Cán Bộ' : 'Hoàn Tất Đăng Ký Tài Khoản Công Dân'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Chuyển hướng sang đăng nhập */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600">
              Đã có tài khoản trên hệ thống?{' '}
              <Link to="/login" className="font-bold text-gov-blue hover:underline">
                Đăng nhập tại đây
              </Link>
            </p>
          </div>

          {/* Footer bảo mật */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Hệ thống bảo mật & giám sát tập trung tỉnh Đồng Nai</span>
          </div>

        </div>
      </div>
    </div>
  );
}
