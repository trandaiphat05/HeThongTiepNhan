import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  CheckCircle2, Copy, Check, ArrowRight, ShieldCheck, Mail
} from 'lucide-react';
import CenterModal from '../../../components/common/CenterModal';
import ComplaintProgressTimeline from './ComplaintProgressTimeline';
import { formatDeptName } from '../../../utils/formatters';

/**
 * Modal Xác Nhận Nộp Hồ Sơ Thành Công
 * - Large tracking code + copy button
 * - 3-step progress
 * - Zero AI Hype
 */
export default function SubmissionModal({ isOpen, onClose, ticketData, onLookupNow }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ticketData) return null;

  const actualData = ticketData.data ? { ...ticketData.data, ...ticketData } : ticketData;
  const trackingCode = actualData.tracking_code || '';
  const deptName = formatDeptName(actualData.dept_code, actualData.dept_name);
  const summary = actualData.summary || actualData.ai_result?.summary || actualData.raw_text || '';

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
    <CenterModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span>Tiếp Nhận Đơn Thư Thành Công</span>
        </div>
      }
      subtitle="Hồ sơ đã được lưu trữ và cấp mã biên nhận điện tử"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-[#5F6368]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Bảo mật theo quy định tiếp nhận</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#5F6368] hover:bg-slate-100 transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleLookup}
              className="bg-[#0B57D0] hover:bg-[#0842A0] text-white px-5 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Xem Tiến Độ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Large Tracking Code + Copy Button */}
        <div className="bg-[#EAF1FB] border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B57D0] block">
              MÃ TRA CỨU HỒ SƠ
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black text-[#041E49] tracking-wider select-all mt-0.5">
              {trackingCode}
            </div>
            <p className="text-xs text-[#5F6368] mt-1">
              Quý công dân vui lòng lưu lại mã này để tra cứu kết quả xử lý.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="bg-white hover:bg-slate-50 text-[#0B57D0] border border-blue-300 font-semibold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
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
        </div>

        {/* 3-Step Progress */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-[#E2E8F0]">
          <span className="text-xs font-semibold text-[#5F6368] block mb-2">
            Tiến trình xử lý:
          </span>
          <ComplaintProgressTimeline ticket={actualData} />
        </div>

        {/* Basic summary */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[#5F6368]">Đơn vị dự kiến thụ lý:</span>
            <strong className="text-[#1F1F1F]">{deptName}</strong>
          </div>
          {summary && (
            <div className="pt-1.5 border-t border-slate-100 text-[#5F6368] line-clamp-2">
              <span className="font-semibold text-[#1F1F1F]">Trích yếu: </span>
              {summary}
            </div>
          )}
        </div>
      </div>
    </CenterModal>
  );
}

SubmissionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  ticketData: PropTypes.object,
  onLookupNow: PropTypes.func,
};
