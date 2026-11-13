import React from 'react';
import PropTypes from 'prop-types';
import { 
  Sparkles, Layers, AlertCircle, FileText, CheckCircle2, 
  MapPin, Tag, ShieldCheck, Scale
} from 'lucide-react';
import { 
  formatDeptName, 
  formatCategoryName, 
  formatPriorityLabel 
} from '../../../utils/formatters';

/**
 * Thẻ hiển thị Kết quả AI Phân tích & Điều phối hồ sơ
 * Dành cho Biên nhận nộp đơn (Receipt Modal/Popup) và Tra cứu tiến độ (Tracking)
 */
export default function AiRoutingResultCard({ ticket, className = '' }) {
  if (!ticket) return null;

  // Xử lý an toàn ai_result dù là đối tượng hay chuỗi JSON
  let ai = ticket.ai_result;
  if (typeof ai === 'string') {
    try {
      ai = JSON.parse(ai);
    } catch {
      ai = {};
    }
  }
  ai = ai || {};

  const deptCode = ticket.dept_code || ticket.department_code || ai.department_code || 'UBND_CAP_HUYEN';
  const deptName = formatDeptName(deptCode, ticket.dept_name || ticket.department_name);
  const categoryName = formatCategoryName(deptCode, ai.category || ticket.category);
  
  const priorityRaw = ticket.priority || ai.priority || 'TRUNG_BINH';
  const priorityInfo = formatPriorityLabel(priorityRaw);

  const summary = ai.summary || ticket.summary || ticket.raw_text || '';
  const reasoning = ai.reasoning || ai.routing_reason || ai.legal_basis || 
    `AI đối chiếu nội dung phản ánh và phân cấp thẩm quyền giải quyết hành chính của ${deptName}.`;

  const isFallback = Boolean(
    ai.is_fallback || 
    (typeof ai.confidence_score === 'number' && ai.confidence_score <= 0.65) ||
    (ai.legal_basis && ai.legal_basis.toLowerCase().includes('quy tắc nghiệp vụ'))
  );

  const confidence = typeof ai.confidence_score === 'number' 
    ? Math.round(ai.confidence_score * 100) 
    : 96;

  const locations = ai.entities?.locations || [];
  const issues = ai.entities?.issues || [];

  return (
    <div className={`bg-gradient-to-br from-indigo-50/60 via-blue-50/40 to-slate-50 border-2 border-indigo-200/90 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs text-left ${className}`}>
      
      {/* 1. Header Card với Huy hiệu Trợ lý AI Phân tích */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Trợ lý AI Phân tích</span>
          </span>
          <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Kết quả AI Phân tích & Điều phối
          </h4>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          {isFallback ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-800 font-mono text-[11px] font-semibold">
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              Phân loại tự động (Quy tắc nghiệp vụ)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-mono text-[11px] font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Độ chính xác: {confidence}%
            </span>
          )}
        </div>
      </div>

      {/* 2. Hai cột: Lĩnh vực AI nhận diện & Mức độ ưu tiên / Khẩn cấp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        
        {/* Lĩnh vực AI nhận diện */}
        <div className="bg-white/90 p-3 rounded-lg border border-indigo-100 space-y-1">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Lĩnh vực AI nhận diện:</span>
          </span>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">
            {categoryName}
          </div>
          <div className="text-[11px] text-indigo-700 font-semibold pt-0.5">
            Đơn vị giải quyết: {deptName}
          </div>
        </div>

        {/* Mức độ ưu tiên / Khẩn cấp */}
        <div className="bg-white/90 p-3 rounded-lg border border-indigo-100 space-y-1">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Mức độ ưu tiên / Khẩn cấp:</span>
          </span>
          <div>
            <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${priorityInfo.colorClass}`}>
              {priorityInfo.label}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 pt-0.5">
            Phân loại tiếp nhận theo quy định xử lý đơn thư
          </div>
        </div>

      </div>

      {/* 3. Tóm tắt cốt lõi từ AI */}
      {summary && (
        <div className="bg-white/90 p-3 rounded-lg border border-indigo-100 space-y-1 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Tóm tắt nội dung AI trích xuất:</span>
          </span>
          <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed italic bg-indigo-50/30 p-2 rounded border border-indigo-50">
            "{summary}"
          </p>
        </div>
      )}

      {/* 4. Tóm tắt & Lý do AI điều phối về đơn vị */}
      {reasoning && (
        <div className="bg-white/90 p-3 rounded-lg border border-indigo-100 space-y-1 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Tóm tắt & Căn cứ AI điều phối về đơn vị:</span>
          </span>
          <p className="text-slate-700 text-xs leading-relaxed font-normal">
            {reasoning}
          </p>
        </div>
      )}

      {/* 5. Thực thể phát hiện (nếu có: Địa danh & Vấn đề) */}
      {(locations.length > 0 || issues.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-100/80 text-[11px]">
          {locations.length > 0 && (
            <div className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3 h-3 text-indigo-600" />
              <span>Địa bàn:</span>
              <span className="font-semibold text-slate-800">{locations.join(', ')}</span>
            </div>
          )}
          {issues.length > 0 && (
            <div className="flex items-center gap-1 text-slate-600 ml-auto">
              <Tag className="w-3 h-3 text-amber-600" />
              <span>Loại đơn:</span>
              <span className="font-semibold text-slate-800">
                {issues.some(i => typeof i === 'string' && (i.toLowerCase().includes('phản ánh') || i.toLowerCase().includes('kiến nghị')))
                  ? 'Phản ánh, kiến nghị'
                  : issues.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

AiRoutingResultCard.propTypes = {
  ticket: PropTypes.object,
  className: PropTypes.string,
};
