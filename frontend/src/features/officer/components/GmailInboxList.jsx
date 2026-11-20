import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Star, Mail, Paperclip, AlertTriangle, RefreshCw, 
  CheckCircle2, Clock, Filter, Search, Inbox, ChevronRight, ChevronLeft
} from 'lucide-react';
import { api } from '../../../services/api';
import { formatDeptName, formatSourceLabel } from '../../../utils/formatters';

/**
 * Inbox View (Gmail List Style)
 * - Row contains: Star, Sender / Tracking_code, Dept badge, Soft orange 'Cần nhập tay' badge if AI_FAILED,
 *   Subject & 1-line snippet, Attachment / Gmail icon, Date.
 * - Hover elevation and smooth transitions.
 * - Compact Gmail-style pagination in toolbar (15 items per page)
 */
export default function GmailInboxList({
  tickets = [],
  loading = false,
  isRefreshing = false,
  onRefresh,
  onSelectTicket,
  selectedTicket = null,
  activeFilter = 'all',
  onFilterChange,
  selectedDept = 'ALL',
  onDeptChange,
  departments = [],
}) {
  const [starredIds, setStarredIds] = useState(() => {
    return new Set((tickets || []).filter((t) => t.is_starred).map((t) => t.ticket_id));
  });
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Pagination state (compact Gmail style: 15 per page)
  const pageSize = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalTickets = tickets.length;
  const totalPages = Math.ceil(totalTickets / pageSize) || 1;

  // Sync starredIds when tickets prop updates
  useEffect(() => {
    setStarredIds(new Set((tickets || []).filter((t) => t.is_starred).map((t) => t.ticket_id)));
  }, [tickets]);

  // Reset to page 1 on filter or department change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, selectedDept]);

  // Keep currentPage within bounds if totalPages shrinks
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalTickets);
  const displayedTickets = tickets.slice(startIndex, endIndex);

  const toggleStar = async (e, ticketId) => {
    e.stopPropagation();
    const willStar = !starredIds.has(ticketId);
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (willStar) next.add(ticketId);
      else next.delete(ticketId);
      return next;
    });

    try {
      await api.toggleStarTicket(ticketId);
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái đánh dấu sao:', err);
      // Revert on error
      setStarredIds((prev) => {
        const next = new Set(prev);
        if (willStar) next.delete(ticketId);
        else next.add(ticketId);
        return next;
      });
    }
  };

  const toggleSelect = (e, ticketId) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (displayedTickets.length > 0 && displayedTickets.every((t) => selectedIds.has(t.ticket_id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        displayedTickets.forEach((t) => next.delete(t.ticket_id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        displayedTickets.forEach((t) => next.add(t.ticket_id));
        return next;
      });
    }
  };

  // Check if a ticket has AI_FAILED
  const isAiFailed = (ticket) => {
    return Boolean(
      ticket.dept_code === 'REQUIRE_HUMAN_REVIEW' ||
      ticket.status === 'HUMAN_REVIEW' ||
      ticket.ai_result?.is_fallback ||
      ticket.ai_failed
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.slice(0, 10);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden flex flex-col h-[calc(100vh-120px)] min-h-[580px]">
      
      {/* Top Action & Filter Toolbar */}
      <div className="p-3 px-4 border-b border-[#E2E8F0] bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left Toolbar: Select all, Refresh, Dept select */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={displayedTickets.length > 0 && displayedTickets.every((t) => selectedIds.has(t.ticket_id))}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded text-[#0B57D0] focus:ring-0 border-slate-300 cursor-pointer"
            title="Chọn tất cả trên trang"
          />

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || isRefreshing}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#5F6368] hover:text-[#1F1F1F] transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || isRefreshing) ? 'animate-spin text-[#0B57D0]' : ''}`} />
          </button>

          {/* Department Dropdown Filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => onDeptChange && onDeptChange(e.target.value)}
              className="bg-[#EAF1FB]/50 border border-[#E2E8F0] rounded-full px-3 py-1 text-xs font-semibold text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0]"
            >
              <option value="ALL">Tất cả Sở / Ngành</option>
              {departments
                .filter((d) => d.code !== 'ALL')
                .map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Right Toolbar: Compact Gmail-style Pagination */}
        <div className="flex items-center gap-2 text-xs text-[#5F6368]">
          {totalTickets > 0 ? (
            <>
              <span className="font-mono text-xs">
                {startIndex + 1}–{endIndex} trong số {totalTickets}
              </span>
              <div className="flex items-center gap-0.5 ml-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-[#5F6368] transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-[#5F6368] transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <span className="font-mono"><strong>0</strong> hồ sơ</span>
          )}
        </div>
      </div>

      {/* Gmail List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
        {loading ? (
          <div className="py-20 text-center text-[#5F6368] text-xs space-y-2">
            <div className="w-6 h-6 border-2 border-[#0B57D0] border-t-transparent rounded-full animate-spin mx-auto" />
            <div>Đang tải danh sách hộp thư...</div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-24 text-center text-[#5F6368] text-xs space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-semibold text-[#1F1F1F]">Không có đơn thư nào</div>
            <p className="text-[11px]">Hộp thư hiện đang trống theo bộ lọc đã chọn.</p>
          </div>
        ) : (
          displayedTickets.map((ticket) => {
            const ticketId = ticket.ticket_id;
            const isSelected = selectedTicket?.ticket_id === ticketId;
            const isChecked = selectedIds.has(ticketId);
            const isStarred = starredIds.has(ticketId);
            const aiFailed = isAiFailed(ticket);
            const isApproved = ticket.status === 'APPROVED';

            const hasAttachment = Boolean(
              ticket.image_url || 
              (Array.isArray(ticket.image_urls) && ticket.image_urls.length > 0)
            );
            const isEmailSource = ticket.source === 'EMAIL';

            const senderText = ticket.citizen_name || 'Công dân khuyết danh';
            const snippet = ticket.ai_result?.summary || ticket.raw_text || '';

            return (
              <div
                key={ticketId}
                onClick={() => onSelectTicket(ticket)}
                className={`
                  group flex items-center gap-3 px-4 py-3 cursor-pointer transition-all select-none
                  ${isSelected ? 'bg-[#E8F0FE]' : 'bg-white hover:bg-[#F2F6FC] hover:shadow-2xs'}
                  ${!isApproved && 'font-medium'}
                `}
              >
                {/* 1. Checkbox */}
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => toggleSelect(e, ticketId)}
                  className="w-4 h-4 rounded text-[#0B57D0] focus:ring-0 border-slate-300 cursor-pointer shrink-0"
                />

                {/* 2. Star Icon */}
                <button
                  type="button"
                  onClick={(e) => toggleStar(e, ticketId)}
                  className="p-0.5 text-[#5F6368] hover:text-amber-500 transition-colors shrink-0"
                  title="Đánh dấu sao"
                >
                  <Star
                    className={`w-4 h-4 ${
                      isStarred
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300 group-hover:text-slate-400'
                    }`}
                  />
                </button>

                {/* 3. Sender & Tracking Code (~180px fixed) */}
                <div className="w-44 sm:w-56 shrink-0 truncate">
                  <span className="text-xs text-[#1F1F1F] font-bold">
                    {senderText}
                  </span>
                  <span className="text-[11px] text-[#5F6368] font-mono ml-1.5">
                    {ticket.tracking_code}
                  </span>
                </div>

                {/* 4. Dept Badge */}
                <div className="shrink-0 hidden md:block">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B57D0] border border-blue-200 whitespace-nowrap">
                    {formatDeptName(ticket.dept_code, ticket.dept_name)}
                  </span>
                </div>

                {/* 5. Soft Orange Badge if AI_FAILED: 'Cần nhập tay' */}
                {aiFailed && (
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-200 whitespace-nowrap">
                      <AlertTriangle className="w-3 h-3 text-orange-600" />
                      <span>Cần nhập tay</span>
                    </span>
                  </div>
                )}

                {/* Approved Badge */}
                {isApproved && (
                  <div className="shrink-0 hidden sm:block">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Đã ban hành</span>
                    </span>
                  </div>
                )}

                {/* 6. Subject & 1-line snippet */}
                <div className="flex-1 min-w-0 text-xs text-[#1F1F1F] truncate leading-normal">
                  <span className="text-[#5F6368] font-normal truncate">
                    {snippet}
                  </span>
                </div>

                {/* 7. Attachment / Gmail Icon */}
                <div className="flex items-center gap-1.5 shrink-0 text-[#5F6368]">
                  {hasAttachment && (
                    <span title="Có tài liệu / ảnh đính kèm">
                      <Paperclip className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {isEmailSource && (
                    <span title="Tiếp nhận qua thư điện tử Gmail">
                      <Mail className="w-3.5 h-3.5 text-[#0B57D0]" />
                    </span>
                  )}
                </div>

                {/* 8. Date */}
                <div className="w-16 sm:w-20 text-right text-[11px] text-[#5F6368] shrink-0 font-medium">
                  {formatDate(ticket.created_at)}
                </div>

                {/* Arrow hint on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <ChevronRight className="w-4 h-4 text-[#0B57D0]" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

GmailInboxList.propTypes = {
  tickets: PropTypes.array,
  loading: PropTypes.bool,
  isRefreshing: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
  onSelectTicket: PropTypes.func.isRequired,
  selectedTicket: PropTypes.object,
  activeFilter: PropTypes.string,
  onFilterChange: PropTypes.func,
  selectedDept: PropTypes.string,
  onDeptChange: PropTypes.func,
  departments: PropTypes.array,
};
