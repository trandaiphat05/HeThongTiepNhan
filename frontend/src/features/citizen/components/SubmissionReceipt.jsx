import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, Copy, Check, ArrowDown, Shield } from 'lucide-react';
import AiRoutingResultCard from './AiRoutingResultCard';
import ComplaintProgressTimeline from './ComplaintProgressTimeline';

/**
 * Component Biên Nhận Tiếp Nhận Đơn Thư Điện Tử
 * Thay thế khung thông báo cũ bằng phong cách GovTech tinh gọn, trang nhã.
 * 
 * @param {Object} props
 * @param {string} props.trackingCode - Mã hồ sơ tra cứu chính thức
 * @param {() => void} props.onLookupNow - Cuộn xuống tra cứu tiến độ ngay
 */
export default function SubmissionReceipt({ trackingCode, onLookupNow, ticketData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!trackingCode) return null;

  const actualData = ticketData?.data ? { ...ticketData.data, ...ticketData } : ticketData;
  const deptName = actualData?.dept_name || actualData?.department_name || 'Sở Giao thông Vận tải';
  const summary = actualData?.summary || actualData?.ai_result?.summary;
  const priority = actualData?.priority || 'TRUNG_BINH';

  return (
    <div className="gov-card p-5 sm:p-6 border-t-4 border-t-emerald-600 space-y-4 animate-fade-in shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Biên Nhận Điện Tử • Đã Tiếp Nhận Hồ Sơ Thành Công
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Hồ Sơ Đã Được Ghi Nhận Vào Hệ Thống Tỉnh Đồng Nai
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80 self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bảo mật theo quy định pháp luật</span>
        </div>
      </div>

      {/* Thông tin thụ lý ban đầu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-emerald-50/40 p-3.5 rounded-lg border border-emerald-100">
        <div>
          <span className="text-slate-500 font-medium block">Cơ quan tiếp nhận giải quyết:</span>
          <span className="font-bold text-emerald-900 text-sm">{deptName}</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium block">Mức độ ưu tiên xử lý:</span>
          <span className="inline-block mt-0.5 px-2 py-0.5 rounded font-bold text-xs bg-emerald-100 text-emerald-900 border border-emerald-300">
            {priority === 'CAO' ? 'ƯU TIÊN CAO / KHẨN' : priority === 'THAP' ? 'TIÊU CHUẨN' : 'TRUNG BÌNH'}
          </span>
        </div>
        {summary && (
          <div className="sm:col-span-2 pt-2 border-t border-emerald-100/80">
            <span className="text-slate-500 font-medium block">Trích yếu nội dung tiếp nhận:</span>
            <p className="text-slate-800 font-medium mt-0.5">"{summary}"</p>
          </div>
        )}
      </div>

      {/* Tiến trình 4 bước chuẩn hành chính công */}
      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
        <ComplaintProgressTimeline ticket={actualData} />
      </div>

      {/* Kết quả AI Phân tích & Điều phối */}
      <AiRoutingResultCard ticket={actualData} />

      {/* Thẻ mã hồ sơ sắc nét */}
      <div className="bg-blue-50/70 border-2 border-blue-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-black uppercase text-gov-blue block">
              MÃ TRA CỨU HỒ SƠ
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-gov-blue tracking-wider select-all">
            {trackingCode}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopy}
            className="gov-btn-secondary text-xs py-2 px-3.5 font-semibold flex-1 sm:flex-initial cursor-pointer"
            title="Sao chép mã vào bộ nhớ tạm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-700">Đã Sao Chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao Chép Mã</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onLookupNow}
            className="gov-btn-primary text-xs py-2 px-4 font-semibold flex-1 sm:flex-initial cursor-pointer"
          >
            <span>Xem Tiến Độ</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 italic">
        * Quý công dân vui lòng lưu lại mã hồ sơ trên để tra cứu kết quả xử lý và văn bản trả lời chính thức ở khung bên dưới.
      </div>
    </div>
  );
}

SubmissionReceipt.propTypes = {
  trackingCode: PropTypes.string,
  onLookupNow: PropTypes.func,
};

