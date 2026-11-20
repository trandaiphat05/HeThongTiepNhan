import React from 'react';
import PropTypes from 'prop-types';
import { ArrowRightLeft } from 'lucide-react';
import { formatDeptName } from '../../../utils/formatters';
import CenterModal from '../../../components/common/CenterModal';
import { ALL_DEPARTMENTS } from '../../../constants/departments';

/**
 * Reassign Department Modal using CenterModal
 */
export default function ReassignModal({
  isOpen,
  onClose,
  selectedTicket,
  reassignDept,
  setReassignDept,
  reassignReason,
  setReassignReason,
  onConfirmReassign,
  isTransferring = false,
  departments = ALL_DEPARTMENTS,
}) {
  if (!selectedTicket) return null;

  return (
    <CenterModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title={
        <div className="flex items-center gap-2 text-[#1F1F1F]">
          <ArrowRightLeft className="w-5 h-5 text-[#0B57D0]" />
          <span>Chuyển Tuyến Thụ Lý Hồ Sơ</span>
        </div>
      }
      subtitle={`Hồ sơ: ${selectedTicket.tracking_code}`}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isTransferring}
            className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#5F6368] hover:bg-slate-200/70 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirmReassign}
            disabled={isTransferring}
            className="bg-[#0B57D0] hover:bg-[#0842A0] text-white px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isTransferring && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isTransferring ? 'Đang chuyển...' : 'Xác Nhận Chuyển'}</span>
          </button>
        </>
      }
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs space-y-1">
          <div className="text-[#5F6368]">
            Đơn vị thụ lý hiện tại:{' '}
            <strong className="text-[#1F1F1F]">
              {formatDeptName(selectedTicket.dept_code, selectedTicket.dept_name)}
            </strong>
          </div>
          <div className="text-[#5F6368] line-clamp-2">
            Nội dung: {selectedTicket.ai_result?.summary || selectedTicket.raw_text}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#1F1F1F] block mb-1">
            Chuyển đến đơn vị thẩm quyền:
          </label>
          <select
            value={reassignDept}
            onChange={(e) => setReassignDept(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0] focus:ring-1 focus:ring-[#0B57D0]"
          >
            {departments
              .filter((d) => d.code !== 'ALL')
              .map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#1F1F1F] block mb-1">
            Lý do chuyển tuyến (ghi chú lưu vết):
          </label>
          <textarea
            rows={3}
            value={reassignReason}
            onChange={(e) => setReassignReason(e.target.value)}
            placeholder="Nêu rõ căn cứ thẩm quyền chuyển tuyến đơn vị..."
            className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0] focus:ring-1 focus:ring-[#0B57D0] leading-relaxed"
          />
        </div>
      </div>
    </CenterModal>
  );
}

ReassignModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedTicket: PropTypes.object,
  reassignDept: PropTypes.string.isRequired,
  setReassignDept: PropTypes.func.isRequired,
  reassignReason: PropTypes.string.isRequired,
  setReassignReason: PropTypes.func.isRequired,
  onConfirmReassign: PropTypes.func.isRequired,
  isTransferring: PropTypes.bool,
  departments: PropTypes.array,
};
