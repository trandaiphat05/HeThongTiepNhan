import React, { useState, useEffect } from 'react';
import { 
  Mail, KeyRound, RefreshCw, CheckCircle2, AlertCircle, 
  HelpCircle, ChevronDown, ChevronUp, X, ExternalLink, ShieldCheck, Inbox
} from 'lucide-react';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';

export default function GmailSyncModal({ isOpen, onClose, onSyncComplete }) {
  const { user } = useAuth();

  const [isLinked, setIsLinked] = useState(false);
  const [linkedAccount, setLinkedAccount] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [gmailAccount, setGmailAccount] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [syncedResult, setSyncedResult] = useState(null);

  // Nạp trạng thái Gmail hiện tại khi mở modal
  useEffect(() => {
    if (isOpen) {
      loadGmailStatus();
      setErrorMessage(null);
      setStatusMessage(null);
      setSyncedResult(null);
    }
  }, [isOpen]);

  const loadGmailStatus = async () => {
    try {
      const res = await authService.getGmailStatus();
      if (res && res.is_linked) {
        setIsLinked(true);
        setLinkedAccount(res.gmail_account || '');
        setLastSyncedAt(res.last_synced_at || '');
        setIsEditing(false);
      } else if (user?.gmail_account) {
        setIsLinked(true);
        setLinkedAccount(user.gmail_account);
        setLastSyncedAt(user.last_synced_at || '');
        setIsEditing(false);
      } else {
        setIsLinked(false);
        setIsEditing(true);
      }
    } catch (e) {
      setIsLinked(false);
      setIsEditing(true);
    }
  };

  // Xác minh và Lưu liên kết Gmail
  const handleLinkGmail = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const cleanAccount = gmailAccount.trim();
    const cleanPassword = appPassword.trim().replace(/\s+/g, '');

    if (!cleanAccount || !cleanAccount.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ Gmail hợp lệ (ví dụ: user@gmail.com).');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 8) {
      setErrorMessage('Mật khẩu ứng dụng Google App Password phải có ít nhất 8 ký tự (chuẩn là 16 ký tự).');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.linkGmail(cleanAccount, cleanPassword);
      setIsLinked(true);
      setLinkedAccount(cleanAccount);
      setIsEditing(false);
      setAppPassword('');
      setStatusMessage(res?.message || 'Đã xác thực và liên kết hòm thư Gmail thành công!');
    } catch (err) {
      console.error('Lỗi liên kết Gmail:', err);
      setErrorMessage(err.message || 'Không thể xác thực Gmail. Vui lòng kiểm tra lại mật khẩu ứng dụng.');
    } finally {
      setLoading(false);
    }
  };

  // Kích hoạt đồng bộ thư Gmail thật
  const handleTriggerSync = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setSyncedResult(null);
    setSyncing(true);

    try {
      const res = await authService.syncGmail({ max_emails: 5 });
      setSyncedResult(res);
      setStatusMessage(res?.message || 'Đồng bộ hòm thư Gmail hoàn tất!');
      if (res?.synced_count > 0 && onSyncComplete) {
        onSyncComplete(res);
      }
      // Cập nhật lại thời gian đồng bộ
      loadGmailStatus();
    } catch (err) {
      console.error('Lỗi đồng bộ Gmail:', err);
      setErrorMessage(err.message || 'Không thể hoàn tất đồng bộ thư từ Gmail.');
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="gov-card bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-[#1E3A8A] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900/80 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <span>Đồng Bộ Hộp Thư Điện Tử Công Vụ</span>
              </h3>
              <p className="text-[11px] text-blue-100">
                {user?.role === 'ADMIN'
                  ? 'Đồng bộ hòm thư tiếp nhận đơn thư tập trung của tỉnh (tiepnhandonthu@dongnai.gov.vn)'
                  : 'Đồng bộ hòm thư xử lý nghiệp vụ của sở/ban ngành phụ trách'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Modal */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-slate-800 text-xs sm:text-sm">
          
          {/* Thông báo Thành công / Trạng thái */}
          {statusMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">{statusMessage}</div>
            </div>
          )}

          {/* Thông báo Lỗi nếu có */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 whitespace-pre-line">{errorMessage}</div>
            </div>
          )}

          {/* Thẻ Trạng Thái Liên Kết Hiện Tại */}
          {isLinked && !isEditing ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ĐÃ KẾT NỐI HÒM THƯ
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-gov-blue hover:underline font-semibold"
                >
                  Thay đổi tài khoản
                </button>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28">Tài khoản Gmail:</span>
                  <strong className="text-slate-900 font-mono text-xs sm:text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                    {linkedAccount}
                  </strong>
                </div>
                {lastSyncedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-28">Lần quét gần nhất:</span>
                    <span className="text-slate-700 font-medium">{lastSyncedAt}</span>
                  </div>
                )}
              </div>

              {/* Nút bấm Đồng bộ Ngay */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={syncing}
                  className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Đang Kết Nối & Đọc Thư Mới...' : 'Đồng Bộ Hộp Thư Ngay'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Form Thiết Lập Liên Kết Gmail */
            <form onSubmit={handleLinkGmail} className="space-y-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-gov-blue" />
                  <span>Cấu Hình Kết Nối Hòm Thư Điện Tử (IMAP)</span>
                </div>
                {isLinked && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Hủy thay đổi
                  </button>
                )}
              </div>

              {/* Ô nhập Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ Gmail cá nhân / công vụ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={gmailAccount}
                    onChange={(e) => setGmailAccount(e.target.value)}
                    placeholder="vidu: ban.dongnai@gmail.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* Ô nhập Google App Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mật khẩu ứng dụng Google (App Password) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Lấy mã này ở đâu?</span>
                    {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="Mã 16 ký tự: abcd efgh ijkl mnop"
                    required
                    className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              {/* Hướng dẫn lấy mật khẩu ứng dụng */}
              {showGuide && (
                <div className="bg-blue-50/90 border border-blue-200 rounded-lg p-3 text-xs text-blue-950 space-y-2 animate-fadeIn">
                  <div className="font-bold flex items-center gap-1.5 text-gov-blue">
                    <span>Hướng dẫn tạo Mật khẩu ứng dụng trong 3 bước:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed">
                    <li>Truy cập <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5">Tài khoản Google <ExternalLink className="w-2.5 h-2.5" /></a> và bật <strong>Xác minh 2 bước</strong>.</li>
                    <li>Vào mục <strong>Bảo mật</strong> &rarr; Tìm <strong>"Mật khẩu ứng dụng"</strong> (App Passwords).</li>
                    <li>Đặt tên: <em>"Đồng Nai Civic AI"</em> &rarr; Bấm <strong>Tạo</strong> &rarr; Sao chép mã 16 chữ cái và dán vào ô trên.</li>
                  </ol>
                  <p className="text-[10px] text-slate-500 italic">
                    * Lưu ý: Không dùng mật khẩu đăng nhập Gmail thông thường vì Google chặn đăng nhập bảo mật IMAP đối với mật khẩu chính.
                  </p>
                </div>
              )}

              {/* Nút bấm Kiểm tra & Lưu */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-xs"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang Kiểm Tra Kết Nối IMAP Gmail...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Kiểm Tra & Lưu Liên Kết Gmail</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Kết quả Đồng bộ Thư Mới */}
          {syncedResult && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Inbox className="w-4 h-4 text-gov-blue" />
                  <span>Kết Quả Đồng Bộ Thư Mới ({syncedResult.synced_count || 0} thư):</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-gov-blue px-2 py-0.5 rounded font-semibold border border-blue-200">
                  Tự Động Số Hóa
                </span>
              </div>

              {syncedResult.tickets && syncedResult.tickets.length > 0 ? (
                <div className="space-y-2">
                  {syncedResult.tickets.map((t, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-gov-blue">{t.tracking_code}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-semibold">
                          Ưu tiên: {t.priority}
                        </span>
                      </div>
                      <div className="font-medium text-slate-900 truncate">
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Từ: {t.sender}</span>
                        <strong className="text-emerald-700">Đã chuyển: {t.dept_name}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 text-center">
                  Hộp thư hiện không có email mới chưa đọc hoặc các thư đã được số hóa trước đó.
                </div>
              )}
            </div>
          )}

          {/* Cam kết bảo mật kết nối */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Hệ thống kết nối an toàn với máy chủ thư điện tử qua giao thức bảo mật SSL/TLS</span>
          </div>

        </div>

        {/* Footer Modal */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}

