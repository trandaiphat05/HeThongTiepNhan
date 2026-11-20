import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Clock, CheckCircle2, XCircle, Shield, Building2, Mail, Check, X, AlertCircle 
} from 'lucide-react';
import { formatDeptName } from '../../../utils/formatters';

/**
 * Danh sách yêu cầu đăng ký tài khoản Cán bộ chờ duyệt của Quản trị viên
 */
export default function PendingOfficerApprovals({ 
  pendingOfficers = [], 
  onApprove, 
  onReject 
}) {
  const [processingId, setProcessingId] = useState(null);

  const handleApprove = async (user) => {
    setProcessingId(user.user_id);
    try {
      await onApprove(user);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (user) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn từ chối yêu cầu đăng ký tài khoản của Cán bộ "${user.full_name}"?`);
    if (!confirmed) return;
    setProcessingId(user.user_id);
    try {
      await onReject(user);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="gov-card p-5 sm:p-6 space-y-4 border-l-4 border-amber-500">
      <div className="border-b border-slate-200/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase">
                Yêu Cầu Đăng Ký Tài Khoản Cán Bộ Chờ Duyệt
              </h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                pendingOfficers.length > 0 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {pendingOfficers.length} yêu cầu
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Thẩm định thông tin công vụ và kích hoạt quyền truy cập vào Bàn làm việc cho cán bộ các Sở/Ngành.
            </p>
          </div>
        </div>
      </div>

      {pendingOfficers.length === 0 ? (
        <div className="py-6 text-center text-slate-500 space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="text-xs sm:text-sm font-semibold text-slate-700">
            Hiện Không Có Yêu Cầu Chờ Duyệt
          </div>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Tất cả các tài khoản cán bộ nộp yêu cầu đăng ký qua hệ thống đều đã được Quản trị viên xử lý hoặc đã ở trạng thái hoạt động.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-amber-50/70 text-slate-700 uppercase text-[11px] font-semibold border-b border-amber-200/80">
                <th className="py-2.5 px-3.5">Họ và Tên Cán Bộ</th>
                <th className="py-2.5 px-3.5">Mã Cán Bộ / Username</th>
                <th className="py-2.5 px-3.5">Email Công Vụ</th>
                <th className="py-2.5 px-3.5">Đơn Vị Đăng Ký</th>
                <th className="py-2.5 px-3.5">Thời Gian Gửi</th>
                <th className="py-2.5 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pendingOfficers.map((u) => {
                const isProcessing = processingId === u.user_id;

                return (
                  <tr key={u.user_id} className="hover:bg-amber-50/30 transition-colors">
                    {/* Họ và tên */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold inline-block mt-0.5">
                        Chờ thẩm định
                      </span>
                    </td>

                    {/* Mã số / Tên đăng nhập */}
                    <td className="py-3 px-3.5 font-mono text-xs">
                      {u.officer_code ? (
                        <div className="font-bold text-gov-blue">{u.officer_code}</div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa cấp</span>
                      )}
                      <div className="text-[11px] text-slate-400 mt-0.5">@{u.username}</div>
                    </td>

                    {/* Email công vụ */}
                    <td className="py-3 px-3.5 font-mono text-xs text-slate-700">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {u.email || 'Chưa cung cấp'}
                      </span>
                    </td>

                    {/* Đơn vị đăng ký */}
                    <td className="py-3 px-3.5 text-slate-800 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gov-blue shrink-0" />
                        {formatDeptName(u.dept_code, u.dept_name)}
                      </span>
                    </td>

                    {/* Thời gian gửi */}
                    <td className="py-3 px-3.5 text-slate-500 text-xs whitespace-nowrap">
                      {u.created_at || 'Mới gửi'}
                    </td>

                    {/* Nút hành động */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Nút Phê duyệt */}
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(u)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Phê duyệt quyền truy cập"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Phê Duyệt</span>
                        </button>

                        {/* Nút Từ chối */}
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleReject(u)}
                          className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs py-1.5 px-2.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Từ chối yêu cầu đăng ký"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Từ Chối</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

PendingOfficerApprovals.propTypes = {
  pendingOfficers: PropTypes.array,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};

