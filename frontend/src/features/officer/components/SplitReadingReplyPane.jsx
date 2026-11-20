import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  ArrowLeft, ArrowRightLeft, Star, CheckCircle2, AlertTriangle, 
  User, Phone, Mail, MapPin, Building2, BookOpen, Save, Send, ShieldCheck
} from 'lucide-react';
import DocumentPhotoViewer from './DocumentPhotoViewer';
import { formatDeptName, formatSourceLabel } from '../../../utils/formatters';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { DEPARTMENT_HEADERS } from '../../../constants/departments';

/**
 * Reading & Reply Pane (Split 45/55)
 * - Left (45%): Original photo / document viewer with page 1/2 switcher, rotate, zoom.
 * - Right (55%): Title, sender info, dept badge, legal basis (clean administrative format).
 *   If AI_FAILED: Open editable inputs for summary, dept, response.
 *   Standard reply editor like Gmail reply with [Lưu nháp] and [Phê duyệt & Ban hành].
 */
export default function SplitReadingReplyPane({
  ticket,
  onBack,
  onApprove,
  onSaveDraft,
  onOpenReassign,
  isSubmittingApproval = false,
  isSavingDraft = false,
  departments = [],
}) {
  if (!ticket) return null;

  const aiResult = ticket.ai_result || {};
  const isAiFailed = Boolean(
    ticket.dept_code === 'REQUIRE_HUMAN_REVIEW' ||
    ticket.status === 'HUMAN_REVIEW' ||
    aiResult.is_fallback ||
    ticket.ai_failed
  );

  // Helper chuẩn hóa dự thảo theo Nghị định 30/2020/NĐ-CP
  const cleanDraftReply = (text) => {
    if (!text) return '';
    let cleaned = text;
    // Thay thế các phân cách gạch chéo / và gạch đứng | thành xuống dòng \n
    if (cleaned.includes(' / ') || cleaned.includes(' | ')) {
      cleaned = cleaned.replace(/\s*[\/|]\s*/g, '\n');
    }
    // Chuẩn hóa năm 2024, 2025 -> năm hiện tại (2026)
    cleaned = cleaned.replace(/năm\s+202[0-5]/gi, `năm ${new Date().getFullYear()}`);
    // Chuẩn hóa số văn bản bịa như "Số: 123/TB-" -> "Số: .../TB-"
    cleaned = cleaned.replace(/Số:\s*\d+\/TB-/gi, 'Số: .../TB-');
    return cleaned;
  };

  const hasSpecificAddress = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return ['đường', 'phường', 'xã', 'khu phố', 'thôn', 'ấp', 'tổ ', 'quận', 'huyện', 'tp', 'thành phố', 'số nhà'].some((k) => lower.includes(k));
  };

  // Editable fields for AI_FAILED or manual correction
  const [summary, setSummary] = useState(aiResult.summary || ticket.raw_text || '');
  const [assignedDept, setAssignedDept] = useState(ticket.dept_code || 'UBND_CAP_HUYEN');
  const [draftReply, setDraftReply] = useState(cleanDraftReply(aiResult.draft_reply || ''));
  const [extractedText, setExtractedText] = useState(aiResult.extracted_text || ticket.raw_text || '');

  // UI state
  const [isSaved, setIsSaved] = useState(false);
  const [isConfirmApproveOpen, setIsConfirmApproveOpen] = useState(false);

  useEffect(() => {
    setSummary(aiResult.summary || ticket.raw_text || '');
    setAssignedDept(ticket.dept_code || 'UBND_CAP_HUYEN');
    setDraftReply(cleanDraftReply(aiResult.draft_reply || ''));
    setExtractedText(aiResult.extracted_text || ticket.raw_text || '');
  }, [ticket]);

  // Load official VN government response template (Nghị định 30/2020/NĐ-CP)
  const applyOfficialTemplate = () => {
    const [orgName, docNo] = DEPARTMENT_HEADERS[assignedDept] || ['ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI', 'Số: .../TB-UBND'];
    const today = new Date();
    const citizenName = ticket.citizen_name || 'Quý công dân';
    const hasAddress = hasSpecificAddress(summary + ' ' + (ticket.raw_text || ''));

    const addressNotice = !hasAddress 
      ? '\n4. Đề nghị Ông/Bà cung cấp bổ sung thông tin địa chỉ, vị trí cụ thể của vụ việc để cơ quan chức năng có cơ sở kiểm tra và xử lý thực tế.'
      : '';

    const template = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-------------------------------

${orgName}
${docNo}                               Đồng Nai, ngày ${String(today.getDate()).padStart(2, '0')} tháng ${String(today.getMonth() + 1).padStart(2, '0')} năm ${today.getFullYear()}

THÔNG BÁO
V/v trả lời phản ánh, kiến nghị của công dân ${citizenName}
(Mã hồ sơ: ${ticket.tracking_code})

Kính gửi: Ông/Bà ${citizenName},

- Căn cứ pháp lý: ${aiResult.legal_basis || 'Luật Khiếu nại 2011, Luật Tiếp công dân 2013 và các quy định pháp luật chuyên ngành'};
- Xét nội dung phản ánh: "${summary}".

${orgName} thông báo nội dung xử lý/hướng dẫn cụ thể như sau:
1. Đã tiếp nhận nội dung và cử tổ thanh tra chuyên ngành kiểm tra thực địa hiện trường.
2. Biện pháp xử lý: Cơ quan đã yêu cầu các bên liên quan khắc phục dứt điểm theo đúng quy định pháp luật.
3. Thời hạn hoàn thành: Kết quả xử lý cụ thể sẽ được thông báo đến công dân trong thời hạn 05 ngày làm việc.${addressNotice}

Nơi nhận:
- Công dân ${citizenName} (để biết);
- Ban Giám đốc Sở;
- Lưu: VT, Tổ Tiếp nhận đơn thư.`;

    setDraftReply(template);
  };

  const handleSaveClick = async () => {
    if (onSaveDraft) {
      await onSaveDraft({
        summary,
        assignedDept,
        department_code: assignedDept,
        draftReply,
        draft_reply: draftReply,
        extractedText,
        extracted_text: extractedText,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleConfirmApproval = async () => {
    setIsConfirmApproveOpen(false);
    if (onApprove) {
      await onApprove({
        draft_reply: draftReply,
        extracted_text: extractedText,
        department_code: assignedDept,
        summary,
      });
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-10 bg-white border border-[#E2E8F0] rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#1F1F1F] text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Hộp thư</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-[#0B57D0]">
              {ticket.tracking_code}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#5F6368]">
              {formatSourceLabel(ticket.source)}
            </span>
            {ticket.priority === 'CAO' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Ưu tiên cao
              </span>
            )}
            {ticket.status === 'APPROVED' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                ✓ Đã ban hành
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenReassign && (
            <button
              type="button"
              onClick={onOpenReassign}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E2E8F0] hover:bg-slate-100 text-[#1F1F1F] text-xs font-semibold transition-colors shadow-2xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#5F6368]" />
              <span>Chuyển tuyến</span>
            </button>
          )}
        </div>
      </div>

      {/* SPLIT 45 / 55 LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        
        {/* ===================== LEFT PANE: 45% (col-span-4 or 5) ===================== */}
        <div className="lg:col-span-4 xl:col-span-4">
          <DocumentPhotoViewer ticket={ticket} />
        </div>

        {/* ===================== RIGHT PANE: 55% (col-span-6) ===================== */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-4">
          
          {/* 1. Header: Title, Sender info & Dept badge */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3.5 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368] block">
                  HỒ SƠ PHẢN ÁNH, KIẾN NGHỊ
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#1F1F1F] mt-0.5 break-words">
                  {summary || 'Phản ánh của công dân'}
                </h2>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-[#0B57D0] border border-blue-200">
                {formatDeptName(assignedDept)}
              </span>
            </div>

            {/* Sender details cluster */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[#5F6368] bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-[#5F6368] shrink-0" />
                <span className="font-semibold text-[#1F1F1F] truncate">
                  {ticket.citizen_name || 'Công dân khuyết danh'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Phone className="w-3.5 h-3.5 text-[#5F6368] shrink-0" />
                <span className="font-mono">{ticket.citizen_phone || 'Chưa cung cấp'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-[#5F6368] shrink-0" />
                <span className="truncate">{ticket.citizen_email || 'Chưa cung cấp'}</span>
              </div>
            </div>

            {/* Legal Basis: Clean Administrative Format */}
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
              <span className="text-xs font-bold text-[#0B57D0] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Căn Cứ Pháp Lý Áp Dụng
              </span>
              <p className="text-xs text-[#1F1F1F] leading-relaxed">
                {aiResult.legal_basis || 'Điều 37, Điều 38 Luật Khiếu nại 2011; Luật Tổ chức chính quyền địa phương 2015; và quy định phân quyền của UBND tỉnh Đồng Nai.'}
              </p>
            </div>
          </div>

          {/* 2. IF AI_FAILED: Open editable inputs for summary, dept, response */}
          {isAiFailed && (
            <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-orange-900 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Hồ Sơ Cần Nhập Tay / Hiệu Chỉnh Thông Tin</span>
              </div>
              <p className="text-xs text-orange-800 leading-relaxed">
                Do chất lượng hình ảnh đơn giấy hoặc tính chất phức tạp của vụ việc, cán bộ vui lòng kiểm tra và hiệu chỉnh trực tiếp trích yếu và cơ quan thụ lý bên dưới:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1F1F] mb-1">
                    Cơ quan thụ lý chính thức:
                  </label>
                  <select
                    value={assignedDept}
                    onChange={(e) => setAssignedDept(e.target.value)}
                    className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0]"
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
                  <label className="block text-xs font-semibold text-[#1F1F1F] mb-1">
                    Trích yếu nội dung sự việc:
                  </label>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Tóm tắt ngắn gọn nội dung sự việc..."
                    className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-xs text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Standard Reply Editor like Gmail Reply */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0B57D0]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">
                  Dự Thảo Công Văn Trả Lời (Nghị định 30/2020/NĐ-CP)
                </span>
              </div>

              <button
                type="button"
                onClick={applyOfficialTemplate}
                className="text-xs text-[#0B57D0] hover:bg-[#EAF1FB] font-semibold px-3 py-1 rounded-full border border-blue-200 transition-colors"
                title="Tự động nạp mẫu văn bản hành chính theo Nghị định 30"
              >
                Nạp Mẫu Chuẩn Nghị Định 30
              </button>
            </div>

            {/* Monospace textarea */}
            <div>
              <textarea
                rows={11}
                value={draftReply}
                onChange={(e) => setDraftReply(e.target.value)}
                className="w-full bg-slate-50/60 focus:bg-white border border-[#E2E8F0] focus:border-[#0B57D0] rounded-xl p-3.5 font-mono text-xs text-[#1F1F1F] leading-relaxed focus:outline-none transition-colors"
                placeholder="Nội dung văn bản thông báo kết quả xử lý..."
              />
            </div>

            {/* Action Bar: [Lưu nháp] and [Phê duyệt & Ban hành] */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-[#5F6368]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Văn bản sau ban hành sẽ gửi tự động đến email công dân</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* [Lưu nháp] */}
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={isSavingDraft}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-full border border-[#E2E8F0] hover:bg-slate-100 text-[#1F1F1F] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {isSavingDraft ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : isSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Đã lưu nháp</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#5F6368]" />
                      <span>Lưu nháp</span>
                    </>
                  )}
                </button>

                {/* [Phê duyệt & Ban hành] */}
                <button
                  type="button"
                  onClick={() => setIsConfirmApproveOpen(true)}
                  disabled={isSubmittingApproval}
                  className="flex-1 sm:flex-initial px-6 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmittingApproval ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang ban hành...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Phê duyệt & Ban hành</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ConfirmModal for Approve & Dispatch */}
      <ConfirmModal
        isOpen={isConfirmApproveOpen}
        onClose={() => setIsConfirmApproveOpen(false)}
        onConfirm={handleConfirmApproval}
        title="Phê Duyệt & Ban Hành Công Văn"
        message={
          <>
            Bạn có chắc chắn muốn phê duyệt và ban hành văn bản trả lời cho hồ sơ{' '}
            <strong className="text-[#1F1F1F] font-mono">{ticket.tracking_code}</strong>?
            Hệ thống sẽ hoàn tất quy trình và gửi thông báo văn bản chính thức đến công dân qua email.
          </>
        }
        confirmText="Xác Nhận Ban Hành"
        isLoading={isSubmittingApproval}
      />
    </div>
  );
}

SplitReadingReplyPane.propTypes = {
  ticket: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onSaveDraft: PropTypes.func,
  onOpenReassign: PropTypes.func,
  isSubmittingApproval: PropTypes.bool,
  isSavingDraft: PropTypes.bool,
  departments: PropTypes.array,
};
