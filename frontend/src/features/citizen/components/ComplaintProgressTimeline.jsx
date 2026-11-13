import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, Clock } from 'lucide-react';
import { formatDeptName } from '../../../utils/formatters';

/**
 * Component hiển thị Tiến Trình 4 Bước Tiếp Nhận & Xử Lý Hồ Sơ Hành Chính Công
 * Đồng bộ tuyệt đối giữa:
 * 1. Popup Xác nhận nộp hồ sơ (SubmissionModal)
 * 2. Khung Biên nhận trực tuyến (SubmissionReceipt)
 * 3. Màn hình Tra cứu tiến độ (ComplaintTrackingSection)
 */
export default function ComplaintProgressTimeline({ ticket, className = '' }) {
  if (!ticket) return null;

  const deptCode = ticket.dept_code || ticket.department_code;
  const rawDeptName = ticket.dept_name || ticket.department_name;
  const deptName = formatDeptName(deptCode, rawDeptName) || 'Đang thẩm tra';

  // Điều kiện trạng thái từng bước
  const step2_done = Boolean(deptCode && deptCode !== 'REQUIRE_HUMAN_REVIEW');
  const step2_current = Boolean(ticket.status === 'HUMAN_REVIEW' || deptCode === 'REQUIRE_HUMAN_REVIEW');

  const step3_done = Boolean(ticket.status === 'APPROVED');
  const step3_current = Boolean(
    step2_done && 
    (ticket.status === 'ROUTED' || 
     ticket.status === 'PROCESSING' || 
     !ticket.status || 
     ticket.status.includes('tiếp nhận') || 
     ticket.status.includes('Chờ xử lý'))
  );

  const step4_done = Boolean(ticket.status === 'APPROVED');

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
          Tiến Trình Xử Lý Hồ Sơ (4 Bước Chuẩn Hành Chính):
        </label>
        <span className="text-[11px] text-gov-blue font-semibold">
          Chuẩn một cửa điện tử tỉnh Đồng Nai
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* Bước 1: Tiếp nhận hồ sơ */}
        <div className="p-3.5 rounded-xl border bg-emerald-50/90 border-emerald-300 text-emerald-950 space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>1. Tiếp Nhận Hồ Sơ</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Đã tiếp nhận và cấp mã biên nhận điện tử trên hệ thống.
          </p>
          <div className="text-[10px] text-emerald-700 font-mono pt-0.5">
            Tiếp nhận: {ticket.created_at || 'Mới nhận'}
          </div>
        </div>

        {/* Bước 2: Phân luồng cơ quan */}
        <div className={`p-3.5 rounded-xl border space-y-1.5 shadow-2xs ${
          step2_done 
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            : (step2_current ? 'bg-amber-50/90 border-amber-300 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-400')
        }`}>
          <div className="flex items-center gap-1.5 font-bold text-xs">
            {step2_done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (step2_current ? (
              <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
            ) : (
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            ))}
            <span>2. Phân Luồng Cơ Quan</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-700">
            {step2_done ? (
              <>Đơn vị chủ trì: <strong className="text-gov-blue">{deptName}</strong></>
            ) : (
              'Tổ tiếp nhận đang thẩm tra phân luồng đơn vị thụ lý.'
            )}
          </p>
        </div>

        {/* Bước 3: Chuyên viên thụ lý */}
        <div className={`p-3.5 rounded-xl border space-y-1.5 shadow-2xs ${
          step3_done
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            : (step3_current ? 'bg-blue-50/90 border-blue-300 text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-400')
        }`}>
          <div className="flex items-center gap-1.5 font-bold text-xs">
            {step3_done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (step3_current ? (
              <Clock className="w-4 h-4 text-gov-blue shrink-0 animate-spin" />
            ) : (
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            ))}
            <span>3. Chuyên Viên Thụ Lý</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-700">
            {step3_done
              ? 'Chuyên viên đã hoàn thành thẩm tra và xây dựng công văn trả lời.'
              : (step3_current
                ? 'Chuyên viên đang kiểm tra thực địa và dự thảo văn bản.'
                : 'Chờ phân công chuyên viên xử lý.')}
          </p>
        </div>

        {/* Bước 4: Hoàn thành & Trả kết quả */}
        <div className={`p-3.5 rounded-xl border space-y-1.5 shadow-2xs ${
          step4_done
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <div className="flex items-center gap-1.5 font-bold text-xs">
            {step4_done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>4. Hoàn Thành & Trả Kết Quả</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-700">
            {step4_done
              ? 'Đã ban hành văn bản trả lời chính thức và thông báo kết quả.'
              : 'Dự kiến ban hành kết quả trong thời hạn 05 ngày làm việc.'}
          </p>
        </div>

      </div>
    </div>
  );
}

ComplaintProgressTimeline.propTypes = {
  ticket: PropTypes.object,
  className: PropTypes.string,
};

