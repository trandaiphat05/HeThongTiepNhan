import React from 'react';
import PropTypes from 'prop-types';
import { 
  Building2, AlertCircle, FileText, CheckCircle2, 
  MapPin, Tag, ShieldCheck, Scale
} from 'lucide-react';
import { 
  formatDeptName, 
  formatCategoryName, 
  formatPriorityLabel 
} from '../../../utils/formatters';

/**
 * Thẻ hiển thị Kết quả Phân loại & Đề xuất Thụ lý
 * Tuân thủ triết lý Human Perspective - Zero AI Hype
 * Không hiệu ứng neon, không confidence score, không robot flashing.
 */
export default function AiRoutingResultCard({ ticket, className = '' }) {
  if (!ticket) return null;

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
    `Phân cấp giải quyết theo thẩm quyền của ${deptName}.`;

  const locations = ai.entities?.locations || [];
  const issues = ai.entities?.issues || [];

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs text-left ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#0B57D0]" />
          <h4 className="text-sm font-bold text-[#1F1F1F]">
            Đề Xuất Phân Luồng Thụ Lý
          </h4>
        </div>
        <span className="text-xs text-[#5F6368] font-medium bg-slate-100 px-2.5 py-0.5 rounded-full">
          Phân loại tự động
        </span>
      </div>

      {/* Grid: Lĩnh vực & Mức độ ưu tiên */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 p-3 rounded-xl border border-[#E2E8F0] space-y-1">
          <span className="text-[#5F6368] font-medium">Lĩnh vực thụ lý:</span>
          <div className="font-bold text-[#1F1F1F] text-xs sm:text-sm">
            {categoryName}
          </div>
          <div className="text-[11px] text-[#0B57D0] font-semibold pt-0.5">
            Đơn vị: {deptName}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-[#E2E8F0] space-y-1">
          <span className="text-[#5F6368] font-medium">Mức độ ưu tiên:</span>
          <div>
            <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${priorityInfo.colorClass}`}>
              {priorityInfo.label}
            </span>
          </div>
          <div className="text-[11px] text-[#5F6368] pt-0.5">
            Theo quy định thời hạn xử lý
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-slate-50 p-3 rounded-xl border border-[#E2E8F0] space-y-1 text-xs">
          <span className="text-[#5F6368] font-medium">Trích yếu nội dung:</span>
          <p className="text-[#1F1F1F] text-xs leading-relaxed font-medium">
            "{summary}"
          </p>
        </div>
      )}

      {/* Reasoning */}
      {reasoning && (
        <div className="bg-slate-50 p-3 rounded-xl border border-[#E2E8F0] space-y-1 text-xs">
          <span className="text-[#5F6368] font-medium">Căn cứ phân công nhiệm vụ:</span>
          <p className="text-[#5F6368] text-xs leading-relaxed font-normal">
            {reasoning}
          </p>
        </div>
      )}

      {/* Entities */}
      {(locations.length > 0 || issues.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E2E8F0] text-[11px]">
          {locations.length > 0 && (
            <div className="flex items-center gap-1 text-[#5F6368]">
              <MapPin className="w-3.5 h-3.5 text-[#0B57D0]" />
              <span>Địa bàn:</span>
              <span className="font-semibold text-[#1F1F1F]">{locations.join(', ')}</span>
            </div>
          )}
          {issues.length > 0 && (
            <div className="flex items-center gap-1 text-[#5F6368] ml-auto">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Vấn đề:</span>
              <span className="font-semibold text-[#1F1F1F]">{issues.join(', ')}</span>
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
