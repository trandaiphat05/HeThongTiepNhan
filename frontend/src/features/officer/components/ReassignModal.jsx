import React from 'react';
import PropTypes from 'prop-types';
import { ArrowRightLeft, X } from 'lucide-react';
import { formatDeptName } from '../../../utils/formatters';

/**
 * Modal Chuyển Cơ Quan Thụ Lý Thủ Công (Human-in-the-Loop Override)
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
  departments = [
    { code: 'SO_GTVT', name: 'Sở Giao thông Vận tải' },
    { code: 'SO_TNMT', name: 'Sở Tài nguyên & Môi trường' },
    { code: 'SO_XD', name: 'Sở Xây dựng' },
    { code: 'SO_YTE', name: 'Sở Y tế' },
    { code: 'SO_GDDT', name: 'Sở Giáo dục & Đào tạo' },
    { code: 'SO_LDTBXH', name: 'Sở Lao động - Thương binh & Xã hội' },
    { code: 'CONG_AN_TINH', name: 'Công an Tỉnh Đồng Nai' },
    { code: 'UBND_CAP_HUYEN', name: 'UBND Cấp Huyện / TP' },
    { code: 'UBND_TINH', name: 'UBND Tỉnh Đồng Nai' },
    { code: 'REQUIRE_HUMAN_REVIEW', name: 'Cần Phân Luồng Ngoại Lệ' },
  ],
}) {
  if (!isOpen || !selectedTicket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft className="w-5 h-5 text-amber-200" />
            <h3 className="font-bold text-base sm:text-lg">
              Chuyển Cơ Quan Thụ Lý Thủ Công
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Form */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <span className="text-slate-500 font-medium">Hồ sơ đang điều phối:</span>
            <div className="font-mono font-bold text-gov-blue text-sm">
              {selectedTicket.tracking_code}
            </div>
            <div className="text-slate-600">
              Cơ quan hiện tại:{' '}
              <strong className="text-slate-800">
                {formatDeptName(selectedTicket.dept_code, selectedTicket.dept_name)}
              </strong>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Chọn cơ quan thụ lý đúng thẩm quyền:
            </label>
            <select
              value={reassignDept}
              onChange={(e) => setReassignDept(e.target.value)}
              className="gov-input py-2 text-sm font-semibold text-slate-800 bg-white"
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
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Lý do chuyển tuyến (bắt buộc theo quy định kiểm toán):
            </label>
            <textarea
              rows={3}
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              placeholder="Ví dụ: Nội dung phản ánh thuộc phân cấp thẩm quyền cấp phép và kiểm tra của Sở Xây dựng..."
              className="gov-input text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isTransferring}
              className="gov-btn-secondary text-xs py-2 px-4 font-semibold cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={onConfirmReassign}
              disabled={isTransferring}
              className="gov-btn-primary text-xs py-2 px-4 font-bold bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowRightLeft className={`w-3.5 h-3.5 ${isTransferring ? 'animate-spin' : ''}`} />
              <span>{isTransferring ? 'Đang Chuyển...' : 'Xác Nhận Chuyển Tuyến'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
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

