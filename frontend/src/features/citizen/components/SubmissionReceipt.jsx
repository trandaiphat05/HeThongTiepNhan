import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, Copy, Check, ShieldCheck, ArrowRight, Plus } from 'lucide-react';
import AiRoutingResultCard from './AiRoutingResultCard';
import ComplaintProgressTimeline from './ComplaintProgressTimeline';
import { formatDeptName } from '../../../utils/formatters';

/**
 * Component Biên Nhận Tiếp Nhận Đơn Thư Điện Tử (SubmissionReceipt)
 * Phong cách tối giản, trang nhã, không AI hype
 */
export default function SubmissionReceipt({ trackingCode, onLookupNow, onNewSubmission, ticketData }) {
  const [copied, setCopied] = useState(false);

  if (!trackingCode) return null;

  const actualData = ticketData?.data ? { ...ticketData.data, ...ticketData } : ticketData;
  const deptName = formatDeptName(actualData?.dept_code, actualData?.dept_name);
  const summary = actualData?.summary || actualData?.ai_result?.summary || actualData?.raw_text;

  const handleCopy = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Biên Nhận Điện Tử • Tiếp Nhận Thành Công
            </span>
            <h3 className="text-base font-bold text-[#1F1F1F]">
              Hồ Sơ Đã Được Ghi Nhận Vào Hệ Thống
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#5F6368] bg-slate-50 px-3 py-1 rounded-full border border-[#E2E8F0]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Bảo mật theo quy định</span>
        </div>
      </div>

      {/* Large Tracking Code + Copy button */}
      <div className="bg-[#EAF1FB] border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B57D0] block">
            MÃ TRA CỨU HỒ SƠ
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-[#041E49] tracking-wider select-all mt-0.5">
            {trackingCode}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="bg-white hover:bg-slate-50 text-[#0B57D0] border border-blue-300 font-semibold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép mã</span>
              </>
            )}
          </button>

          {onLookupNow && (
            <button
              type="button"
              onClick={() => onLookupNow(trackingCode)}
              className="bg-[#0B57D0] hover:bg-[#0842A0] text-white font-semibold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span>Xem tiến độ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {onNewSubmission && (
            <button
              type="button"
              onClick={onNewSubmission}
              className="bg-white hover:bg-slate-100 text-[#1F1F1F] border border-[#E2E8F0] font-semibold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#5F6368]" />
              <span>Gửi đơn khác</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Step Progress Timeline */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-[#E2E8F0]">
        <ComplaintProgressTimeline ticket={actualData} />
      </div>

      {/* Routing Result */}
      <AiRoutingResultCard ticket={actualData} />
    </div>
  );
}

SubmissionReceipt.propTypes = {
  trackingCode: PropTypes.string,
  onLookupNow: PropTypes.func,
  onNewSubmission: PropTypes.func,
  ticketData: PropTypes.object,
};
