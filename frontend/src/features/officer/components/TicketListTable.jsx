import React from 'react';
import PropTypes from 'prop-types';
import { Search, RefreshCw, AlertTriangle, Layers, Clock, User } from 'lucide-react';
import { formatSourceLabel, formatDeptName } from '../../../utils/formatters';

/**
 * Cột Danh Sách Hồ Sơ Đơn Thư & Bộ Lọc Nghiệp Vụ (TicketListTable)
 */
export default function TicketListTable({
  tickets = [],
  selectedTicket = null,
  onSelectTicket,
  selectedDept,
  setSelectedDept,
  selectedSource,
  setSelectedSource,
  selectedPriority,
  setSelectedPriority,
  searchQuery,
  setSearchQuery,
  loading = false,
  isRefreshing = false,
  onRefresh,
  departments = [],
  sources = [],
  priorities = [],
}) {
  return (
    <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col h-[calc(100vh-250px)] min-h-[620px] overflow-hidden">
      
      {/* 1. Header Cột Trái & Nút Làm Mới */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
            <span>Hàng Đợi Hồ Sơ</span>
            <span className="text-xs font-normal text-slate-500">
              ({tickets.length})
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">Chọn hồ sơ để đối chiếu & duyệt</p>
        </div>

        <button
          type="button"
          onClick={() => onRefresh(true)}
          disabled={loading || isRefreshing}
          className="gov-btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 cursor-pointer"
          title="Tải lại danh sách"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gov-blue ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Làm Mới</span>
        </button>
      </div>

      {/* 2. Bộ Lọc Tìm Kiếm Đa Tiêu Chí */}
      <div className="p-3 border-b border-slate-200/60 bg-white space-y-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã hồ sơ, nội dung, người gửi..."
            className="gov-input pl-8 py-1.5 text-xs w-full"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="gov-input py-1 text-[11px] truncate bg-white"
            title="Lọc theo phòng ban"
          >
            {departments.map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="gov-input py-1 text-[11px] truncate bg-white"
            title="Lọc theo kênh gửi"
          >
            {sources.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="gov-input py-1 text-[11px] truncate bg-white"
            title="Lọc theo độ ưu tiên"
          >
            {priorities.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Danh Sách Thẻ Hồ Sơ */}
      <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2 space-y-1.5">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <div className="w-6 h-6 border-2 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>Đang tải hồ sơ từ CSDL...</div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-1">
            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <div className="font-semibold text-slate-600">Không có hồ sơ nào</div>
            <p className="text-[11px]">Thử nới lỏng các tiêu chí tìm kiếm hoặc lọc.</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const isSelected = selectedTicket?.ticket_id === ticket.ticket_id;
            const isHumanReview = ticket.dept_code === 'REQUIRE_HUMAN_REVIEW' || ticket.status === 'HUMAN_REVIEW';

            return (
              <div
                key={ticket.ticket_id}
                onClick={() => onSelectTicket(ticket)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-gov-blue bg-blue-50/60 shadow-xs ring-1 ring-gov-blue/20'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {/* Header Thẻ: Mã & Nguồn */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-gov-blue">
                    {ticket.tracking_code}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {formatSourceLabel(ticket.source)}
                  </span>
                </div>

                {/* Người gửi */}
                <div className="text-xs font-semibold text-slate-800 truncate mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{ticket.citizen_name || 'Công dân khuyết danh'}</span>
                </div>

                {/* Tóm tắt ngắn */}
                <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed mb-2">
                  {ticket.ai_result?.summary || ticket.raw_text}
                </p>

                {/* Badges: Phòng ban & Mức độ ưu tiên */}
                <div className="flex flex-wrap items-center gap-1 mb-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-gov-blue border border-blue-200">
                    {formatDeptName(ticket.dept_code, ticket.dept_name)}
                  </span>

                  {isHumanReview && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Cần Duyệt</span>
                    </span>
                  )}

                  {ticket.priority === 'CAO' && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      Khẩn
                    </span>
                  )}

                  {ticket.status === 'APPROVED' && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Đã Duyệt
                    </span>
                  )}
                </div>

                {/* Footer Thẻ */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{ticket.created_at || 'Mới nộp'}</span>
                  </span>
                  <span className="font-medium text-slate-500">
                    Trạng thái: <strong className="text-gov-blue">{ticket.status === 'APPROVED' ? 'Đã duyệt' : (ticket.dept_code === 'REQUIRE_HUMAN_REVIEW' ? 'Chờ phân luồng' : 'Chờ xử lý')}</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

TicketListTable.propTypes = {
  tickets: PropTypes.array,
  selectedTicket: PropTypes.object,
  onSelectTicket: PropTypes.func.isRequired,
  selectedDept: PropTypes.string.isRequired,
  setSelectedDept: PropTypes.func.isRequired,
  selectedSource: PropTypes.string.isRequired,
  setSelectedSource: PropTypes.func.isRequired,
  selectedPriority: PropTypes.string.isRequired,
  setSelectedPriority: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isRefreshing: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
  departments: PropTypes.array,
  sources: PropTypes.array,
  priorities: PropTypes.array,
};

