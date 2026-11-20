import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Upload, X, Send, AlertCircle
} from 'lucide-react';
import { api } from '../../../services/api';

/**
 * Biểu Mẫu Gửi Phản Ánh, Đơn Thư - Tiêu chuẩn Hiện đại & Tối giản
 * - Khung tải ảnh full-width chuẩn Gmail, kéo thả hoặc chọn nhiều ảnh từ thiết bị
 * - Lưới ảnh xem trước kèm nút [X]
 * - Trình gửi đơn tinh gọn, AI tự động trích xuất nội dung từ ảnh đính kèm
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
  const [isDragging, setIsDragging] = useState(false);

  const isSubmittingRef = useRef(false);
  const fileInputRef = useRef(null);

  const handleFilesAdded = (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;
    const combined = [...selectedFiles, ...Array.from(newFiles)].slice(0, 5);
    setSelectedFiles(combined);
    const newPreviews = combined.map((f) => URL.createObjectURL(f));
    setPreviewUrls(newPreviews);
  };

  const removeFile = (idxToRemove) => {
    const updated = selectedFiles.filter((_, i) => i !== idxToRemove);
    setSelectedFiles(updated);
    setPreviewUrls(updated.map((f) => URL.createObjectURL(f)));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    setSubmitError(null);

    // Validate phone regex: /^(0|\+84)[0-9]{9,10}$/
    const phoneTrimmed = (formData.citizen_phone || '').trim().replace(/\s+/g, '');
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(phoneTrimmed)) {
      setSubmitError('Số điện thoại không hợp lệ (gồm 10-11 chữ số, bắt đầu bằng 0 hoặc +84).');
      return;
    }

    // Validate content: if (!formData.raw_text.trim() && selectedFiles.length === 0)
    const rawTextTrimmed = (formData.raw_text || '').trim();
    if (!rawTextTrimmed && selectedFiles.length === 0) {
      setSubmitError('Vui lòng nhập nội dung phản ánh hoặc đính kèm ảnh đơn thư.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      let contentText = rawTextTrimmed;
      if (!contentText && selectedFiles.length > 0) {
        contentText = 'Đơn thư phản ánh viết tay gửi kèm hình ảnh hiện trường';
      }

      let combinedText = contentText;
      if (formData.title.trim()) {
        combinedText = `[Tiêu đề: ${formData.title.trim()}]\n${combinedText}`;
      }
      if (formData.citizen_address.trim()) {
        combinedText = `[Địa chỉ: ${formData.citizen_address.trim()}]\n${combinedText}`;
      }

      const payload = {
        citizen_name: formData.citizen_name.trim(),
        citizen_phone: phoneTrimmed,
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
      setSubmitError('Không thể gửi hồ sơ tới máy chủ tiếp nhận. Vui lòng thử lại sau giây lát.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* 1. Đính kèm ảnh / Đơn giấy: Khung tải ảnh full-width chuẩn Gmail */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3.5 shadow-xs">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">
          ĐÍNH KÈM ẢNH ĐƠN THƯ / HIỆN TRƯỜNG (TÙY CHỌN)
        </label>

        {/* Khung tải ảnh duy nhất full-width chuẩn Gmail */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full py-6 px-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 select-none ${
            isDragging
              ? 'border-[#0B57D0] bg-[#EAF1FB]'
              : 'border-[#CBD5E1] hover:border-[#0B57D0] bg-slate-50/60 hover:bg-[#EAF1FB]/30'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0B57D0]">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[#1F1F1F] block">
              Tải ảnh lên từ thiết bị
            </span>
            <span className="text-xs text-[#5F6368] mt-0.5 block">
              Kéo thả ảnh vào đây hoặc bấm để chọn tệp (JPEG, PNG, WebP) - Tối đa 5 ảnh
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />
        </div>

        {/* Thumbnail Grid with [X] */}
        {previewUrls.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pt-2">
            {previewUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative w-20 h-20 rounded-xl border border-[#E2E8F0] overflow-hidden bg-slate-50 shadow-2xs group"
              >
                <img
                  src={url}
                  alt={`Tệp đính kèm ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="absolute top-1 right-1 bg-slate-900/75 hover:bg-rose-600 text-white rounded-full p-1 transition-colors"
                  title="Xóa ảnh"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Thông tin người gửi */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3.5 shadow-xs">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">
          Thông Tin Người Gửi
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#5F6368] mb-1">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.citizen_name}
              onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
              placeholder="Nguyễn Văn An"
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-sm text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5F6368] mb-1">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.citizen_phone}
              onChange={(e) => setFormData({ ...formData, citizen_phone: e.target.value })}
              placeholder="0912 345 678"
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-sm font-mono text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5F6368] mb-1">
              Email nhận phản hồi
            </label>
            <input
              type="email"
              value={formData.citizen_email}
              onChange={(e) => setFormData({ ...formData, citizen_email: e.target.value })}
              placeholder="nguyenvanan@gmail.com"
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-sm text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5F6368] mb-1">
              Địa bàn / Địa chỉ phát sinh sự việc
            </label>
            <input
              type="text"
              value={formData.citizen_address}
              onChange={(e) => setFormData({ ...formData, citizen_address: e.target.value })}
              placeholder="Phường/Xã, Huyện/TP..."
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-sm text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0]"
            />
          </div>
        </div>
      </div>

      {/* 3. Nội dung phản ánh */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3 shadow-xs">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">
          Nội Dung Phản Ánh, Kiến Nghị
        </label>
        <div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Tiêu đề vụ việc (Ví dụ: Sụt lún đường Quốc lộ 1K qua phường Hóa An)"
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-sm font-semibold text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0] mb-2.5"
          />
          <textarea
            rows={5}
            value={formData.raw_text}
            onChange={(e) => setFormData({ ...formData, raw_text: e.target.value })}
            placeholder="Mô tả cụ thể sự việc, thời gian, địa điểm và nguyện vọng giải quyết..."
            className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3.5 text-sm text-[#1F1F1F] focus:outline-none focus:border-[#0B57D0] leading-relaxed"
          />
        </div>
      </div>

      {/* 4. Nút Gửi Đơn */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#0B57D0] hover:bg-[#0842A0] text-white px-8 py-3 rounded-full text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang gửi đơn...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Gửi Đơn Thư</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

ComplaintSubmitForm.propTypes = {
  onSubmitSuccess: PropTypes.func,
};
