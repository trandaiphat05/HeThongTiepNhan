import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Mail, KeyRound, RefreshCw, CheckCircle2, AlertCircle, 
  HelpCircle, ChevronDown, ChevronUp, Unlink, ExternalLink, ShieldCheck
} from 'lucide-react';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
import CenterModal from '../../../components/common/CenterModal';

/**
 * Gmail Sync Modal using CenterModal
 * Features:
 * - Real-time Gmail connection status
 * - Connect with Gmail + 16-char App Password
 * - Sync Now button with spinner
 * - Disconnect / Unlink button
 */
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
  const [disconnecting, setDisconnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [syncedResult, setSyncedResult] = useState(null);

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
    } catch {
      setIsLinked(false);
      setIsEditing(true);
    }
  };

  const handleLinkGmail = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const cleanAccount = gmailAccount.trim();
    const cleanPassword = appPassword.trim().replace(/\s+/g, '');

    if (!cleanAccount || !cleanAccount.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ Gmail hợp lệ (ví dụ: canbo@dongnai.gov.vn hoặc user@gmail.com).');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 8) {
      setErrorMessage('Mật khẩu ứng dụng Google App Password phải có 16 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.linkGmail(cleanAccount, cleanPassword);
      setIsLinked(true);
      setLinkedAccount(cleanAccount);
      setIsEditing(false);
      setAppPassword('');
      setStatusMessage(res?.message || 'Đã xác thực và kết nối hòm thư Gmail thành công.');
    } catch (err) {
      setErrorMessage(err.message || 'Không thể xác thực Gmail. Vui lòng kiểm tra lại mật khẩu ứng dụng.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setSyncedResult(null);
    setSyncing(true);

    try {
      const res = await authService.syncGmail({ max_emails: 5 });
      setSyncedResult(res);
      setStatusMessage(res?.message || 'Đã đồng bộ hòm thư Gmail thành công.');
      if (res?.synced_count > 0 && onSyncComplete) {
        onSyncComplete(res);
      }
      loadGmailStatus();
    } catch (err) {
      setErrorMessage(err.message || 'Không thể hoàn tất đồng bộ thư từ Gmail.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await authService.unlinkGmail();
      setIsLinked(false);
      setLinkedAccount('');
      setLastSyncedAt('');
      setIsEditing(true);
      setStatusMessage('Đã ngắt kết nối hòm thư Gmail thành công.');
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi ngắt kết nối Gmail.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <CenterModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EAF1FB] flex items-center justify-center text-[#0B57D0]">
            <Mail className="w-4 h-4" />
          </div>
          <span>Kết Nối Hòm Thư Điện Tử Gmail</span>
        </div>
      }
      subtitle="Đồng bộ tự động các phản ánh, kiến nghị gửi qua thư điện tử vào hệ thống tiếp nhận"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Status Message */}
        {statusMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{statusMessage}</div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Connection State Card */}
        {isLinked && !isEditing ? (
          <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ĐÃ KẾT NỐI
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-[#0B57D0] hover:underline font-semibold"
              >
                Đổi tài khoản
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-[#5F6368]">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span>Địa chỉ Gmail:</span>
                <strong className="text-[#1F1F1F] font-mono">{linkedAccount}</strong>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Quét lần cuối:</span>
                <span className="text-[#1F1F1F] font-medium">{lastSyncedAt || 'Chưa thực hiện'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={syncing}
                className="flex-1 bg-[#0B57D0] hover:bg-[#0842A0] text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Đang đồng bộ...' : 'Đồng Bộ Ngay'}</span>
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Ngắt kết nối tài khoản này"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>{disconnecting ? 'Đang ngắt...' : 'Ngắt kết nối'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form connect Gmail */
          <form onSubmit={handleLinkGmail} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F1F1F] mb-1">
                Tài khoản Gmail tiếp nhận:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5F6368] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={gmailAccount}
                  onChange={(e) => setGmailAccount(e.target.value)}
                  placeholder="vidu: tiepnhan.dongnai@gmail.com"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0] focus:ring-1 focus:ring-[#0B57D0]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#1F1F1F]">
                  Mật khẩu ứng dụng (16 ký tự Google App Password):
                </label>
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-[11px] text-[#0B57D0] hover:underline flex items-center gap-0.5"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Cách lấy mật khẩu</span>
                </button>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#5F6368] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx (16 ký tự)"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-16 py-2 text-xs sm:text-sm font-mono text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0] focus:ring-1 focus:ring-[#0B57D0]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#5F6368] hover:text-[#1F1F1F]"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {/* Guide Collapsible */}
            {showGuide && (
              <div className="bg-slate-50 border border-[#E2E8F0] p-3 rounded-xl text-xs space-y-1.5 text-[#5F6368]">
                <p className="font-semibold text-[#1F1F1F]">Hướng dẫn tạo Mật khẩu ứng dụng Gmail:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Bật Xác minh 2 bước trong tài khoản Google cá nhân/công vụ.</li>
                  <li>Truy cập mục Bảo mật &gt; Mật khẩu ứng dụng (App Passwords).</li>
                  <li>Tạo mật khẩu mới cho ứng dụng Đơn Thư Đồng Nai và dán 16 ký tự vào đây.</li>
                </ol>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              {isLinked && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs text-[#5F6368] hover:bg-slate-100 rounded-full font-semibold"
                >
                  Hủy
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0B57D0] hover:bg-[#0842A0] text-white py-2 px-5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang kết nối...</span>
                  </>
                ) : (
                  <span>Kết Nối & Lưu Cấu Hình</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Synced summary if any */}
        {syncedResult && syncedResult.synced_count !== undefined && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs space-y-1 text-[#0B57D0]">
            <div className="font-semibold">Kết quả đồng bộ hòm thư:</div>
            <div>
              Số email tiếp nhận mới: <strong>{syncedResult.synced_count}</strong> thư
            </div>
          </div>
        )}
      </div>
    </CenterModal>
  );
}

GmailSyncModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSyncComplete: PropTypes.func,
};
