import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FileText, Search, Building2, Calendar, ArrowRight, RefreshCw, User
} from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { formatSourceLabel, formatDeptName } from '../../../utils/formatters';

/**
 * Danh Sách Lịch Sử Đơn Thư Đã Gửi Của Công Dân
 * Hiển thị toàn bộ các đơn đã gửi gắn với tài khoản công dân đang đăng nhập
 * (Bao gồm cả đơn nộp trực tiếp trên web và đơn gửi từ địa chỉ email đã đăng ký tới tiepnhandonthu@dongnai.gov.vn)
 */
export default function CitizenComplaintHistory({ onSelectTicket, onGoToSubmit }) {
  const { user, isAuthenticated } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError, setLoadError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    setTickets([]);
    setLoadError('');
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    api.getMyTickets(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setTickets(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError('Không tải được lịch sử đơn thư. Vui lòng thử lại.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [isAuthenticated, user?.user_id, user?.email, user?.gmail_account, refreshCount]);

  // Lọc theo từ khóa tìm kiếm
  const filteredTickets = tickets.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.tracking_code?.toLowerCase().includes(q) ||
      t.raw_text?.toLowerCase().includes(q) ||
      t.dept_name?.toLowerCase().includes(q) ||
      t.ai_result?.summary?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* 1. Header Khối Lịch Sử */}
      <div className="gov-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase flex items-center gap-2">
                <FileText className="w-5 h-5 text-gov-blue" />
                Lịch Sử Đơn Thư & Phản Ánh Đã Gửi
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-gov-blue border border-blue-200">
                {tickets.length} hồ sơ
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isAuthenticated ? (
                <span>
                  Danh sách hồ sơ gắn với tài khoản của <strong>{user?.full_name}</strong> (Email: <span className="font-mono text-gov-blue">{user?.email || 'Chưa cập nhật'}</span>).
                </span>
              ) : (
                'Hiển thị các đơn thư đã nộp trực tuyến và đơn gửi qua hòm thư điện tử chính thức.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || !isAuthenticated}
              onClick={() => setRefreshCount((count) => count + 1)}
              className="gov-btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm Mới</span>
            </button>
          </div>
        </div>

        {/* Khung tìm kiếm hồ sơ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo mã hồ sơ (ĐN-...), trích yếu hoặc đơn vị giải quyết..."
              className="gov-input pl-9 text-xs sm:text-sm py-2"
            />
          </div>

        </div>
      </div>

      {/* 2. Banner nhắc nhở nếu chưa đăng nhập */}
      {!isAuthenticated && (
        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-slate-700">
          <User className="w-5 h-5 text-gov-blue shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-slate-900">
              Đăng nhập tài khoản Công dân để quản lý lịch sử thuận tiện hơn
            </div>
            <p className="leading-relaxed text-slate-600">
              Hệ thống tự động liên kết tất cả các đơn thư gửi từ email cá nhân và đơn nộp trực tuyến khi bạn đăng nhập tài khoản.
            </p>
          </div>
        </div>
      )}

      {/* 3. Danh Sách Hồ Sơ Đã Gửi */}
      {!isAuthenticated ? null : loadError ? (
        <p role="alert" className="text-sm text-red-700">{loadError}</p>
      ) : loading ? (
        <div className="gov-card p-10 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Đang đồng bộ dữ liệu đơn thư của bạn...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="gov-card p-10 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="text-base font-bold text-slate-800">
            Chưa Tìm Thấy Đơn Phản Ánh Nào
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {searchQuery 
              ? `Không tìm thấy đơn nào phù hợp với từ khóa "${searchQuery}".`
              : 'Ông/Bà chưa nộp đơn thư phản ánh nào từ tài khoản này hoặc hộp thư đã liên kết.'}
          </p>
          {onGoToSubmit && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onGoToSubmit}
                className="gov-btn-primary text-xs py-2 px-4 font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Nộp Phản Ánh Trực Tuyến Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredTickets.map((ticket) => {
            const isApproved = ticket.status === 'APPROVED';
            const isHumanReview = ticket.status === 'HUMAN_REVIEW' || ticket.dept_code === 'REQUIRE_HUMAN_REVIEW';

            let statusLabel = 'Đang Thụ Lý';
            let statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
            if (isApproved) {
              statusLabel = 'Đã Có Kết Quả Trả Lời';
              statusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            } else if (isHumanReview) {
              statusLabel = 'Đang Phân Tuyến';
              statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
            }

            const title = ticket.ai_result?.summary || ticket.raw_text?.split('\n')[0] || 'Phản ánh, kiến nghị của công dân';

            return (
              <div 
                key={ticket.ticket_id || ticket.tracking_code}
                className="gov-card p-4 sm:p-5 hover:border-gov-blue/50 transition-all space-y-3 shadow-2xs"
              >
                {/* Dòng trên cùng: Mã tracking, Kênh & Trạng thái */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm sm:text-base font-bold text-gov-blue">
                      {ticket.tracking_code}
                    </span>
                    <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      Nguồn: {formatSourceLabel(ticket.source)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                    <span className="text-xs text-slate-400 font-normal hidden sm:inline">•</span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {ticket.created_at || 'Mới gửi'}
                    </span>
                  </div>
                </div>

                {/* Tiêu đề / Nội dung trích yếu */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {title}
                  </h4>
                  <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ticket.raw_text}
                  </div>
                </div>

                {/* Thông tin đơn vị thụ lý & Nút tra cứu tiến độ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100/80 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Building2 className="w-4 h-4 text-gov-blue shrink-0" />
                    <span>Cơ quan giải quyết:</span>
                    <strong className="text-slate-900">
                      {formatDeptName(ticket.dept_code, ticket.dept_name)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTicket(ticket.tracking_code)}
                    className="gov-btn-primary text-xs py-1.5 px-3.5 font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs self-end sm:self-auto"
                  >
                    <span>Xem Tiến Độ Xử Lý</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

CitizenComplaintHistory.propTypes = {
  onSelectTicket: PropTypes.func.isRequired,
  onGoToSubmit: PropTypes.func,
};

