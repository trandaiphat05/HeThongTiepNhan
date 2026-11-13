import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  FileText, CheckCircle2, AlertCircle, Send, ShieldCheck, Mail, UploadCloud, X, Image as ImageIcon
} from 'lucide-react';
import { api } from '../../../services/api';

/**
 * Biểu Mẫu Nộp Đơn Phản Ánh, Kiến Nghị Trực Tuyến - Cổng Dịch Vụ Công Tỉnh Đồng Nai
 * Thuần văn bản hành chính & Kênh gửi thư điện tử công vụ (Zero Image Upload / OCR)
 */
export default function ComplaintSubmitForm({ onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    citizen_name: '',
    citizen_phone: '',
    citizen_email: '',
    citizen_address: '',
    title: '',
    raw_text: '',
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const combined = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(combined);
    const newPreviews = combined.map(f => URL.createObjectURL(f));
    setPreviewUrls(newPreviews);
  };

  const removeFile = (idxToRemove) => {
    const updated = selectedFiles.filter((_, i) => i !== idxToRemove);
    setSelectedFiles(updated);
    setPreviewUrls(updated.map(f => URL.createObjectURL(f)));
  };

  const sampleSuggestions = [
    'Sụt lún mặt đường và xuất hiện nhiều ổ gà lớn trên Quốc lộ 1K qua Biên Hòa gây nguy hiểm',
    'Cống thoát nước khu dân cư KP4 Trảng Dài bị ứ đọng bốc mùi hôi thối sau các cơn mưa lớn',
    'Hàng xóm mở loa công suất lớn hát karaoke quá 22h đêm ảnh hưởng sinh hoạt cộng đồng',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.raw_text.trim()) {
      setSubmitError('Vui lòng nhập chi tiết nội dung phản ánh, kiến nghị.');
      return;
    }

    setIsSubmitting(true);
    try {
      let combinedText = formData.raw_text.trim();
      if (formData.title.trim()) {
        combinedText = `[Tiêu đề: ${formData.title.trim()}]\n${combinedText}`;
      }
      if (formData.citizen_address.trim()) {
        combinedText = `[Địa chỉ: ${formData.citizen_address.trim()}]\n${combinedText}`;
      }

      const payload = {
        citizen_name: formData.citizen_name.trim(),
        citizen_phone: formData.citizen_phone.trim(),
        citizen_email: formData.citizen_email.trim(),
        raw_text: combinedText,
        source: selectedFiles.length > 0 ? 'WEB_IMAGE' : 'WEB_TEXT',
      };

      const res = await api.submitTicket(payload, selectedFiles);
      const code = res.tracking_code || res.data?.tracking_code;

      setFormData({
        citizen_name: '',
        citizen_phone: '',
        citizen_email: '',
        citizen_address: '',
        title: '',
        raw_text: '',
      });
      setSelectedFiles([]);
      setPreviewUrls([]);

      if (onSubmitSuccess && code) {
        onSubmitSuccess(code, res);
      }
    } catch (err) {
      console.error('Lỗi gửi hồ sơ:', err);
      setSubmitError('Không thể gửi hồ sơ tới máy chủ tiếp nhận. Vui lòng thử lại sau giây lát.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Banner thông báo lỗi nếu có */}
      {submitError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{submitError}</span>
        </div>
      )}

      {/* ===================== KHỐI 1: THÔNG TIN NGƯỜI GỬI ===================== */}
      <div className="gov-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-gov-blue text-xs font-bold flex items-center justify-center">
            1
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase">
            Thông Tin Người Gửi Phản Ánh
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Họ và tên người gửi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.citizen_name}
              onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="gov-input text-sm py-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Số điện thoại liên hệ <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.citizen_phone}
              onChange={(e) => setFormData({ ...formData, citizen_phone: e.target.value })}
              placeholder="0912 345 678"
              className="gov-input text-sm py-2.5 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email nhận thông báo kết quả giải quyết <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.citizen_email}
              onChange={(e) => setFormData({ ...formData, citizen_email: e.target.value })}
              placeholder="vidu@gmail.com"
              className="gov-input text-sm py-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Địa chỉ nơi xảy ra vụ việc / Nơi cư trú
            </label>
            <input
              type="text"
              value={formData.citizen_address}
              onChange={(e) => setFormData({ ...formData, citizen_address: e.target.value })}
              placeholder="Số nhà, tên đường, phường/xã, TP. Biên Hòa / Huyện..."
              className="gov-input text-sm py-2.5"
            />
          </div>
        </div>
      </div>

      {/* ===================== KHỐI 2: NỘI DUNG PHẢN ÁNH TRỰC TUYẾN ===================== */}
      <div className="gov-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-gov-blue text-xs font-bold flex items-center justify-center">
            2
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase">
            Nội Dung Phản Ánh, Kiến Nghị
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tiêu đề phản ánh / Trích yếu vụ việc
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ví dụ: Phản ánh sụt lún mặt đường Quốc lộ 1K qua phường Hóa An..."
              className="gov-input text-sm py-2.5 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Chi tiết sự việc kiến nghị, phản ánh <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              value={formData.raw_text}
              onChange={(e) => setFormData({ ...formData, raw_text: e.target.value })}
              placeholder="Mô tả cụ thể sự việc, thời gian xảy ra, địa điểm và nguyện vọng giải quyết của công dân..."
              className="gov-input font-normal leading-relaxed text-sm sm:text-base"
            />

            {/* Gợi ý mẫu sự việc */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-400 font-medium">Mẫu tham khảo:</span>
              {sampleSuggestions.map((text, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, raw_text: text })}
                  className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-gov-blue text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
                >
                  {text.slice(0, 38)}...
                </button>
              ))}
            </div>

            {/* Tải tệp hình ảnh / tài liệu đính kèm */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Hình ảnh tài liệu, đơn giấy / hiện trường đính kèm (nếu có):</span>
                <span className="text-[11px] text-slate-400 font-normal">Hỗ trợ JPG, PNG, WEBP (tối đa 5 ảnh)</span>
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                  <UploadCloud className="w-4 h-4 text-gov-blue" />
                  <span>Chọn Hình Ảnh / Tài Liệu</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
                
                {selectedFiles.length > 0 && (
                  <span className="text-xs text-slate-600 font-medium">
                    Đã chọn {selectedFiles.length} hình ảnh
                  </span>
                )}
              </div>

              {/* Preview thumbnails */}
              {previewUrls.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mt-3 pt-2 border-t border-slate-100">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative group w-20 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      <img src={url} alt={`Ảnh đính kèm ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-slate-900/70 hover:bg-rose-600 text-white rounded-full p-1 opacity-90 transition-colors cursor-pointer"
                        title="Xóa ảnh"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== KHUNG HƯỚNG DẪN TIẾP NHẬN QUA EMAIL ===================== */}
      <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 text-xs text-slate-700 shadow-2xs">
        <div className="w-9 h-9 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Mail className="w-5 h-5 text-amber-300" />
        </div>
        <div className="leading-relaxed flex-1">
          <span className="font-bold text-slate-900 block text-xs mb-0.5">
            Kênh Tiếp Nhận Qua Thư Điện Tử Công Vụ Tập Trung:
          </span>
          <span>
            Hoặc gửi đơn thư trực tiếp về hòm thư tiếp nhận tập trung của tỉnh:{' '}
            <strong className="text-gov-blue font-mono font-bold text-xs sm:text-sm">tiepnhandonthu@dongnai.gov.vn</strong>
          </span>
        </div>
      </div>

      {/* ===================== KHỐI 3: NÚT GỬI ĐƠN & BẢO MẬT ===================== */}
      <div className="gov-card p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 text-center sm:text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Hồ sơ được mã hóa và bảo mật theo quy định tiếp nhận đơn thư hành chính tỉnh Đồng Nai.</span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="gov-btn-primary w-full sm:w-auto px-7 py-3 text-sm sm:text-base font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Đang Tiếp Nhận...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Gửi Phản Ánh, Kiến Nghị</span>
            </>
          )}
        </button>
      </div>

      {/* ===================== THANH TIẾN TRÌNH TIẾP NHẬN ===================== */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-gov-blue shadow-xs">
              <div className="w-7 h-7 border-3 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Đang tiếp nhận hồ sơ...
              </h3>
              <p className="text-xs text-slate-500">
                Hệ thống đang ghi nhận thông tin và cấp mã tra cứu điện tử. Vui lòng chờ trong giây lát.
              </p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div className="bg-gov-blue h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      )}

    </form>
  );
}

ComplaintSubmitForm.propTypes = {
  onSubmitSuccess: PropTypes.func,
};
