import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, Clock } from 'lucide-react';
import { formatDeptName } from '../../../utils/formatters';

/**
 * 3-Step Progress Timeline for Citizen Complaints
 * Step 1: Đã tiếp nhận
 * Step 2: Đang thụ lý
 * Step 3: Phê duyệt & Ban hành
 */
export default function ComplaintProgressTimeline({ ticket, className = '' }) {
  if (!ticket) return null;

  const deptCode = ticket.dept_code || ticket.department_code;
  const rawDeptName = ticket.dept_name || ticket.department_name;
  const deptName = formatDeptName(deptCode, rawDeptName) || 'Cơ quan chuyên môn';

  const isApproved = ticket.status === 'APPROVED';
  const isHumanReview = ticket.status === 'HUMAN_REVIEW' || deptCode === 'REQUIRE_HUMAN_REVIEW';
  const isProcessing = Boolean(ticket.status === 'ROUTED' || ticket.status === 'PROCESSING' || isHumanReview);

  const steps = [
    {
      step: 1,
      title: '1. Tiếp Nhận',
      desc: 'Đã tiếp nhận vào hệ thống',
      time: ticket.created_at || 'Mới nộp',
      isDone: true,
      isCurrent: !isProcessing && !isApproved,
    },
    {
      step: 2,
      title: '2. Đang Thụ Lý',
      desc: isHumanReview ? 'Tổ tiếp nhận đang phân luồng' : `Đơn vị: ${deptName}`,
      isDone: isApproved,
      isCurrent: isProcessing && !isApproved,
    },
    {
      step: 3,
      title: '3. Phê Duyệt & Ban Hành',
      desc: isApproved ? 'Đã hoàn tất ban hành công văn' : 'Chờ hoàn tất xử lý',
      isDone: isApproved,
      isCurrent: isApproved,
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {steps.map((st) => {
          let cardStyle = 'bg-slate-50 border-[#E2E8F0] text-[#5F6368]';
          let icon = <Clock className="w-4 h-4 text-[#5F6368]" />;

          if (st.isDone) {
            cardStyle = 'bg-emerald-50/80 border-emerald-200 text-emerald-900';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
          } else if (st.isCurrent) {
            cardStyle = 'bg-blue-50/80 border-blue-200 text-[#0B57D0]';
            icon = <Clock className="w-4 h-4 text-[#0B57D0] animate-spin" />;
          }

          return (
            <div
              key={st.step}
              className={`p-3.5 rounded-xl border space-y-1 transition-all ${cardStyle}`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {icon}
                <span>{st.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed line-clamp-1">
                {st.desc}
              </p>
              {st.time && (
                <div className="text-[10px] text-[#5F6368] font-mono pt-0.5">
                  {st.time}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

ComplaintProgressTimeline.propTypes = {
  ticket: PropTypes.object,
  className: PropTypes.string,
};
