import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  CheckCircle2, Copy, Check, ArrowDown, Shield, 
  X, ExternalLink, Calendar, Building2, FileText
} from 'lucide-react';
import AiRoutingResultCard from './AiRoutingResultCard';
import ComplaintProgressTimeline from './ComplaintProgressTimeline';

/**
 * Modal Xác Nhận Nộp Hồ Sơ Chuẩn Hành Chính
 * Hiển thị ngay sau khi công dân nộp đơn phản ánh trực tuyến
 */
export default function SubmissionModal({ isOpen, onClose, ticketData, onLookupNow }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ticketData) return null;

  const actualData = ticketData.data ? { ...ticketData.data, ...ticketData } : ticketData;
  const trackingCode = actualData.tracking_code || '';
  const createdAt = actualData.created_at || new Date().toLocaleString('vi-VN');
  const statusText = actualData.status || 'Đã tiếp nhận - Chờ xử lý';
  const deptName = actualData.dept_name || actualData.department_name || 'Sở Giao thông Vận tải';
  const summary = actualData.summary || actualData.raw_text || '';

  const handleCopy = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleLookup = () => {
    if (onLookupNow && trackingCode) {
      onLookupNow(trackingCode);
    }
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto animate-fade-in">
        
        {/* 1. Header Hành Chính */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-widest block">
                ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                Xác Nhận Tiếp Nhận Đơn Thư Điện Tử
              </h3>
            </div>
          </div>
        </div>

        {/* 2. Thẻ Mã Hồ Sơ Nổi Bật */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 border-2 border-blue-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-gov-blue block">
                  MÃ TRA CỨU HỒ SƠ
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-black text-gov-blue tracking-wider select-all">
                {trackingCode}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sử dụng mã này để tra cứu trạng thái và nhận văn bản trả lời chính thức.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="gov-btn-primary text-xs sm:text-sm py-2.5 px-4 font-semibold flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Đã Sao Chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao Chép Mã</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Tiến Trình 4 Bước Chuẩn Hành Chính Công (Đồng Bộ Tuyệt Đối) */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <ComplaintProgressTimeline ticket={actualData} />
          </div>

          {/* 4. Bảng Chi Tiết Thông Tin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <div className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-gov-blue" />
                <span>Thời gian tiếp nhận:</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{createdAt}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <div className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Trạng thái tiếp nhận:</span>
              </div>
              <div className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>{statusText}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1 sm:col-span-2">
              <div className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-gov-blue" />
                <span>Cơ quan tiếp nhận giải quyết:</span>
              </div>
              <div className="font-bold text-gov-blue text-sm">{deptName}</div>
            </div>

            {/* Kết quả AI Phân tích & Điều phối */}
            <div className="sm:col-span-2">
              <AiRoutingResultCard ticket={actualData} />
            </div>

            {summary && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1 sm:col-span-2">
                <div className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-gov-blue" />
                  <span>Trích yếu sự việc tiếp nhận:</span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {summary}
                </p>
              </div>
            )}
          </div>

          {/* Lời dặn dò */}
          <p className="text-[11px] text-slate-500 italic leading-relaxed pt-2 border-t border-slate-100">
            * Hồ sơ của Quý công dân đã được mã hóa và chuyển về đơn vị chức năng thụ lý theo quy trình phân công. Quý công dân vui lòng lưu lại mã hồ sơ để tra cứu kết quả xử lý.
          </p>

          {/* 5. Nút Thao Tác */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="gov-btn-secondary text-xs sm:text-sm py-2.5 px-4 w-full sm:w-auto font-semibold cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleLookup}
              className="gov-btn-primary text-xs sm:text-sm py-2.5 px-5 w-full sm:w-auto font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Tra Cứu Tiến Độ Ngay</span>
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

SubmissionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  ticketData: PropTypes.object,
  onLookupNow: PropTypes.func,
};

