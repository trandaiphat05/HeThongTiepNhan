import React, { useState, useEffect, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Search, CheckCircle2, Clock, FileText 
} from 'lucide-react';
import { api } from '../../../services/api';
import { formatDeptName } from '../../../utils/formatters';
import AiRoutingResultCard from './AiRoutingResultCard';
import ComplaintProgressTimeline from './ComplaintProgressTimeline';

/**
 * Khung Tra Cứu Tiến Độ Xử Lý Đơn Thư Trực Tuyến
 * 
 * @param {Object} props
 * @param {string} props.initialCode - Mã hồ sơ điền sẵn (từ biên nhận)
 */
const ComplaintTrackingSection = forwardRef(function ComplaintTrackingSection(
  { initialCode = '' }, 
  ref
) {
  const [lookupCode, setLookupCode] = useState(initialCode);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);

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
      setLookupError(err.message || 'Không tìm thấy hồ sơ với mã tra cứu trên.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    executeLookup(lookupCode);
  };

  const sampleCodes = ['ĐN-20261112-001', 'ĐN-20261112-002', 'ĐN-20261112-5944'];

  return (
    <div ref={ref} className="gov-card p-5 sm:p-6 space-y-5 scroll-mt-20">
      <div className="border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gov-blue" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase">
            Tra Cứu Tiến Độ Xử Lý Đơn Thư Trực Tuyến
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Nhập mã hồ sơ đã được cấp khi gửi đơn để theo dõi hành trình thẩm định và nhận văn bản trả lời chính thức.
        </p>
      </div>

      {/* Form tra cứu */}
      <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={lookupCode}
          onChange={(e) => setLookupCode(e.target.value)}
          placeholder="Nhập mã tra cứu hồ sơ (Ví dụ: ĐN-20261112-001)"
          className="gov-input font-mono uppercase text-sm sm:text-base flex-1 py-2.5"
        />
        <button
          type="submit"
          disabled={isLookingUp}
          className="gov-btn-primary py-2.5 px-6 text-sm font-semibold shrink-0 cursor-pointer shadow-xs"
        >
          {isLookingUp ? 'Đang Tra Cứu...' : 'Tra Cứu Tiến Độ'}
        </button>
      </form>

      {/* Mã mẫu thử nghiệm */}
      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
        <span>Mã mẫu thử nghiệm:</span>
        {sampleCodes.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => {
              setLookupCode(code);
              executeLookup(code);
            }}
            className="font-mono text-gov-blue hover:underline font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
          >
            {code}
          </button>
        ))}
      </div>

      {lookupError && (
        <div className="p-3 bg-amber-50 border-l-3 border-amber-500 text-amber-900 text-xs sm:text-sm rounded-r-md">
          {lookupError}
        </div>
      )}

      {/* KẾT QUẢ TRA CỨU TIẾN ĐỘ VỚI THANH TRẠNG THÁI 3 BƯỚC */}
      {lookupResult && (
        <div className="pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
          
          {/* Header kết quả */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80">
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-500 block">
                Mã Hồ Sơ Tra Cứu:
              </span>
              <span className="text-xl font-mono font-bold text-gov-blue">
                {lookupResult.tracking_code}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Đơn vị chủ trì:</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                {formatDeptName(lookupResult.dept_code, lookupResult.dept_name) || 'Đang thẩm tra'}
              </span>
            </div>
          </div>

          {/* TIẾN TRÌNH 4 BƯỚC CHUẨN HÀNH CHÍNH CÔNG (ĐỒNG BỘ TUYỆT ĐỐI) */}
          <ComplaintProgressTimeline ticket={lookupResult} />

          {/* KẾT QUẢ AI PHÂN TÍCH & ĐIỀU PHỐI */}
          <AiRoutingResultCard ticket={lookupResult} />

          {/* Nội dung phản ánh gốc */}
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80 space-y-1.5 text-xs sm:text-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">Nội dung phản ánh gốc:</span>
            <p className="text-slate-800 leading-relaxed italic">
              "{lookupResult.raw_text}"
            </p>
          </div>

          {/* VĂN BẢN TRẢ LỜI CHÍNH THỨC */}
          {lookupResult.ai_result?.draft_reply && (
            <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-4 sm:p-5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gov-blue" />
                  <span className="text-xs font-bold uppercase text-gov-blue">
                    Văn Bản Trả Lời Công Dân Của Cơ Quan Nhà Nước
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Căn cứ: <strong className="text-slate-700">{lookupResult.ai_result.legal_basis}</strong>
                </span>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-100/80 text-slate-900 text-sm leading-relaxed font-normal shadow-2xs whitespace-pre-line">
                {lookupResult.ai_result.draft_reply}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
});

ComplaintTrackingSection.propTypes = {
  initialCode: PropTypes.string,
};

export default ComplaintTrackingSection;

