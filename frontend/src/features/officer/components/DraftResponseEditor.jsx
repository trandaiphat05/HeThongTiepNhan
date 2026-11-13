import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Building2, Check, ArrowRightLeft, Save, CheckCircle2 } from 'lucide-react';

/**
 * Khung Soạn Thảo & Phê Duyệt Văn Bản Trả Lời Chuẩn Thể Thức Nghị Định 30/2020/NĐ-CP
 */
export default function DraftResponseEditor({
  editedDraftReply,
  setEditedDraftReply,
  onApplyTemplate,
  onApprove,
  isSubmittingApproval = false,
  onTransfer,
  isTransferring = false,
  onSaveDraft,
  selectedTicket = null,
}) {
  const [justSaved, setJustSaved] = useState(false);

  const handleSaveClick = () => {
    setJustSaved(true);
    if (onSaveDraft) onSaveDraft();
    setTimeout(() => setJustSaved(false), 3000);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Header và Nút Nạp Mẫu Nghị định 30 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-gov-blue" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Dự Thảo Công Văn Trả Lời (Nghị định 30/2020/NĐ-CP)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApplyTemplate}
            className="text-xs text-gov-blue hover:underline font-semibold bg-blue-50 px-2.5 py-1 rounded border border-blue-200 cursor-pointer transition-colors hover:bg-blue-100"
            title="Nạp cấu trúc công văn hành chính chuẩn Nghị định 30/2020/NĐ-CP"
          >
            Nạp Mẫu Chuẩn Nghị Định 30
          </button>
          <span className="text-[11px] text-slate-400 font-mono">
            {(editedDraftReply || '').length} ký tự
          </span>
        </div>
      </div>

      {/* Ô Soạn thảo Văn bản Monospace */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold">Nội dung công văn phát hành chính thức:</span>
          <span className="text-slate-400 text-[11px]">Cán bộ có thể gõ chỉnh sửa trực tiếp bên dưới</span>
        </div>
        <textarea
          rows={12}
          value={editedDraftReply}
          onChange={(e) => setEditedDraftReply(e.target.value)}
          className="gov-input font-mono text-xs sm:text-sm leading-relaxed bg-slate-50/40 focus:bg-white transition-colors"
          placeholder="CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM&#10;Độc lập - Tự do - Hạnh phúc&#10;...&#10;Kính gửi: Quý công dân&#10;...&#10;Nội dung trả lời..."
        />
      </div>

      {/* Thanh Hành Động Phê Duyệt & Lưu Thay Đổi */}
      <div className="bg-slate-50 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 rounded-b-xl border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
        <div className="text-xs text-slate-500">
          Hồ sơ sau khi phê duyệt sẽ hoàn tất quy trình thụ lý và gửi thông báo văn bản chính thức đến người dân.
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {onTransfer && (
            <button
              type="button"
              onClick={onTransfer}
              disabled={isTransferring}
              className="gov-btn-secondary text-xs sm:text-sm py-2 px-3 w-full sm:w-auto cursor-pointer"
              title="Chuyển hồ sơ phức tạp sang hàng đợi Admin"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>{isTransferring ? 'Đang Chuyển...' : 'Chuyển Tuyến Ngoại Lệ'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveClick}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer w-full sm:w-auto"
            title="Lưu lại các nội dung vừa chỉnh sửa"
          >
            {justSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Đã Lưu Thay Đổi</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-gov-blue" />
                <span>Lưu Thay Đổi</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onApprove}
            disabled={isSubmittingApproval || !selectedTicket}
            className="gov-btn-primary text-xs sm:text-sm py-2 px-5 font-bold shadow-xs hover:shadow-sm w-full sm:w-auto cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isSubmittingApproval ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang Phê Duyệt & Ban Hành...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-amber-300" />
                <span>Phê Duyệt & Ban Hành</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

DraftResponseEditor.propTypes = {
  editedDraftReply: PropTypes.string.isRequired,
  setEditedDraftReply: PropTypes.func.isRequired,
  onApplyTemplate: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  isSubmittingApproval: PropTypes.bool,
  onTransfer: PropTypes.func,
  isTransferring: PropTypes.bool,
  onSaveDraft: PropTypes.func,
  selectedTicket: PropTypes.object,
};

