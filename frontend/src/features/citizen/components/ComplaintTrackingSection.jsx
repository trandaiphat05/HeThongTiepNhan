import React, { useState, useEffect, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Search, Copy, Check, AlertCircle, Building2, Calendar, FileText } from 'lucide-react';
import { api } from '../../../services/api';
import ComplaintProgressTimeline from './ComplaintProgressTimeline';
import AiRoutingResultCard from './AiRoutingResultCard';
import { formatDeptName } from '../../../utils/formatters';

/**
 * Khung Tra Cứu Tiến Độ Xử Lý Đơn Thư
 * - Large tracking code + copy button + 3-step progress
 * - Clean administrative styling
 */
const ComplaintTrackingSection = forwardRef(function ComplaintTrackingSection(
  { initialCode = '' }, 
  ref
) {
  const [lookupCode, setLookupCode] = useState(initialCode);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setLookupCode(initialCode);
      executeLookup(initialCode);
    }
  }, [initialCode]);

  const executeLookup = async (code) => {
    if (!code || !code.trim()) return;
    setIsLookingUp(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const ticket = await api.lookupTicket(code.trim());
      setLookupResult(ticket);
    } catch (err) {
      setLookupError(err.response?.data?.detail || 'Không tìm thấy hồ sơ với mã đã nhập. Vui lòng kiểm tra lại.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    executeLookup(lookupCode);
  };

  const handleCopy = (code) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const sampleCodes = ['ĐN-20261112-001', 'ĐN-20261112-002'];

  return (
    <div ref={ref} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs scroll-mt-20">
      <div className="border-b border-[#E2E8F0] pb-3">
        <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
          <Search className="w-5 h-5 text-[#0B57D0]" />
          <span>Tra Cứu Tiến Độ Xử Lý Đơn Thư</span>
        </h3>
        <p className="text-xs text-[#5F6368] mt-0.5">
          Nhập mã biên nhận điện tử để theo dõi kết quả thụ lý và nhận công văn trả lời chính thức.
        </p>
      </div>

      {/* Form tra cứu */}
      <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5F6368] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value)}
            placeholder="Nhập mã tra cứu (Ví dụ: ĐN-20261112-001)"
            className="w-full bg-[#EAF1FB]/50 border border-[#E2E8F0] rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono uppercase text-[#1F1F1F] focus:outline-none focus:bg-white focus:border-[#0B57D0]"
          />
        </div>
        <button
          type="submit"
          disabled={isLookingUp}
          className="bg-[#0B57D0] hover:bg-[#0842A0] text-white py-2.5 px-6 rounded-full text-xs sm:text-sm font-semibold shrink-0 transition-colors shadow-xs disabled:opacity-50"
        >
          {isLookingUp ? 'Đang Tra Cứu...' : 'Tra Cứu'}
        </button>
      </form>

      {/* Quick sample buttons */}
      <div className="text-xs text-[#5F6368] flex flex-wrap items-center gap-1.5">
        <span>Mã mẫu:</span>
        {sampleCodes.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => {
              setLookupCode(code);
              executeLookup(code);
            }}
            className="font-mono text-xs text-[#0B57D0] bg-[#EAF1FB] hover:bg-[#d8e7fc] px-2.5 py-0.5 rounded-full transition-colors"
          >
            {code}
          </button>
        ))}
      </div>

      {/* Error state */}
      {lookupError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{lookupError}</span>
        </div>
      )}

      {/* Result View */}
      {lookupResult && (
        <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
          {/* Large Tracking Code + Copy button */}
          <div className="bg-[#EAF1FB] border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B57D0] block">
                MÃ TRA CỨU HỒ SƠ
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-black text-[#041E49] tracking-wider select-all mt-0.5">
                {lookupResult.tracking_code || lookupResult.ticket_code}
              </div>
              <div className="text-xs text-[#5F6368] mt-1 flex items-center gap-2">
                <span>Người gửi: <strong>{lookupResult.citizen_name || 'Công dân'}</strong></span>
                <span>•</span>
                <span>Đơn vị: <strong>{formatDeptName(lookupResult.dept_code, lookupResult.dept_name)}</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(lookupResult.tracking_code || lookupResult.ticket_code)}
              className="bg-white hover:bg-slate-50 text-[#0B57D0] border border-blue-300 font-semibold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors shadow-2xs"
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
          <div className="bg-slate-50 p-4 rounded-2xl border border-[#E2E8F0]">
            <span className="text-xs font-semibold text-[#5F6368] block mb-2">
              Tiến trình giải quyết đơn thư:
            </span>
            <ComplaintProgressTimeline ticket={lookupResult} />
          </div>

          {/* Details */}
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
            <div className="font-semibold text-[#1F1F1F] text-sm">
              Trích yếu nội dung:
            </div>
            <p className="text-[#5F6368] leading-relaxed">
              {lookupResult.ai_result?.summary || lookupResult.raw_text}
            </p>

            {/* Official Reply if Approved */}
            {lookupResult.status === 'APPROVED' && lookupResult.ai_result?.draft_reply && (
              <div className="mt-3 pt-3 border-t border-[#E2E8F0] bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-1">
                  Công văn phản hồi chính thức:
                </span>
                <div className="font-mono text-xs text-[#1F1F1F] whitespace-pre-line leading-relaxed">
                  {lookupResult.ai_result.draft_reply}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ComplaintTrackingSection.propTypes = {
  initialCode: PropTypes.string,
};

export default ComplaintTrackingSection;
