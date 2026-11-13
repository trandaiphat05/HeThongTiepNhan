import React from 'react';
import PropTypes from 'prop-types';
import { FileCheck, MapPin, AlertCircle, BookOpen, FileText } from 'lucide-react';

/**
 * Thẻ Hiển Thị Kết Quả Bóc Tách Thực Thể, Số Hóa & Căn Cứ Pháp Lý (AiAnalysisCard)
 */
export default function AiAnalysisCard({
  ticket,
  editedExtractedText,
  setEditedExtractedText,
}) {
  if (!ticket) return null;

  const aiResult = ticket.ai_result || {};
  const locations = aiResult.entities?.locations || [];
  const issues = aiResult.entities?.issues || [];

  return (
    <div className="space-y-4">
      {/* TRÍCH YẾU VỤ VIỆC & THỰC THỂ */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            Trích Yếu Vụ Việc & Dữ Liệu Số Hóa
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-gov-blue font-medium">
            Trích yếu tự động
          </span>
        </div>

        {/* Hộp Tóm Tắt Trích Yếu */}
        <div className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-lg space-y-1">
          <span className="text-xs font-semibold text-gov-blue block uppercase tracking-wider">
            Trích yếu nội dung:
          </span>
          <p className="text-slate-800 text-sm font-medium leading-relaxed">
            {aiResult.summary || ticket.raw_text || 'Hồ sơ đã được tiếp nhận và lưu trữ trên hệ thống.'}
          </p>
        </div>

        {/* Địa danh & Vấn đề */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 space-y-1.5">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gov-blue" />
              <span>Địa danh phát hiện:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {locations.length > 0 ? (
                locations.map((loc, i) => (
                  <span key={i} className="bg-white border border-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-medium">
                    {loc}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs italic">Chưa xác định</span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 space-y-1.5">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Vấn đề / Sự cố chính:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {issues.length > 0 ? (
                issues.map((iss, i) => (
                  <span key={i} className="bg-white border border-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-medium">
                    {iss}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs italic">Chưa xác định</span>
              )}
            </div>
          </div>
        </div>

        {/* Văn bản số hóa (có thể hiệu chỉnh) */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Nội dung số hóa từ hồ sơ:
            </label>
            <span className="text-[11px] text-slate-400">Cán bộ có thể hiệu chỉnh trực tiếp nội dung nếu cần</span>
          </div>
          <textarea
            rows={3}
            value={editedExtractedText}
            onChange={(e) => setEditedExtractedText(e.target.value)}
            className="gov-input text-xs leading-relaxed"
            placeholder="Nội dung số hóa..."
          />
        </div>
      </div>

      {/* 3. CƠ SỞ PHÁP LÝ ĐỐI CHIẾU */}
      <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4 sm:p-5 space-y-2">
        <div className="flex items-center justify-between border-b border-blue-100/80 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gov-blue flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-gov-blue" />
            Căn Cứ Pháp Lý Áp Dụng
          </span>
          <span className="text-[11px] text-blue-700 font-medium">Văn bản quy định liên quan</span>
        </div>

        <div className="p-3.5 bg-white border border-blue-200/60 rounded-lg text-slate-800 text-sm leading-relaxed font-normal">
          {aiResult.legal_basis || 'Áp dụng các quy định phân quyền quản lý hành chính tỉnh Đồng Nai.'}
        </div>
      </div>
    </div>
  );
}

AiAnalysisCard.propTypes = {
  ticket: PropTypes.object,
  editedExtractedText: PropTypes.string,
  setEditedExtractedText: PropTypes.func.isRequired,
};

