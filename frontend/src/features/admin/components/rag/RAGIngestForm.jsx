import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { api } from '../../../../services/api';

/**
 * Form nạp và tự động phân mảnh (Chunking) văn bản quy phạm pháp luật vào SQL Server
 * 
 * @param {Object} props
 * @param {() => void} props.onSuccess - Callback khi nạp thành công
 * @param {(type: 'success' | 'warning', message: string) => void} props.onToast - Thông báo toast
 */
export default function RAGIngestForm({ onSuccess, onToast }) {
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestCategory, setIngestCategory] = useState('CHUNG');
  const [ingestContent, setIngestContent] = useState('');
  const [ingestFile, setIngestFile] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!ingestContent.trim() && !ingestFile) {
      setFormError('Vui lòng nhập nội dung văn bản hoặc chọn tệp đính kèm (.pdf, .docx, .txt, .md).');
      return;
    }

    setIsIngesting(true);
    try {
      const formData = new FormData();
      if (ingestTitle) formData.append('title', ingestTitle);
      formData.append('category', ingestCategory);
      if (ingestContent) formData.append('content', ingestContent);
      if (ingestFile) formData.append('file', ingestFile);

      const res = await api.ingestRAGDoc(formData);
      if (onToast) {
        onToast('success', res.message || `Đã nạp thành công "${res.document_title || ingestTitle}" (${res.total_chunks || 1} đoạn điều luật) vào CSDL!`);
      }

      setIngestTitle('');
      setIngestContent('');
      setIngestFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi nạp văn bản';
      setFormError(msg);
      if (onToast) onToast('warning', 'Lỗi nạp văn bản: ' + msg);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleClear = () => {
    setIngestTitle('');
    setIngestContent('');
    setIngestFile(null);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase">
            Tên Văn Bản / Số Hiệu Nghị Định:
          </label>
          <input
            type="text"
            value={ingestTitle}
            onChange={(e) => setIngestTitle(e.target.value)}
            placeholder="vd: Nghị định 11/2010/NĐ-CP về Quản lý hạ tầng giao thông đường bộ..."
            className="gov-input text-xs sm:text-sm py-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase">
            Lĩnh Vực Thẩm Quyền:
          </label>
          <select
            value={ingestCategory}
            onChange={(e) => setIngestCategory(e.target.value)}
            className="gov-input text-xs sm:text-sm py-2 font-medium text-slate-800"
          >
            <option value="CHUNG">Quy định chung</option>
            <option value="SO_GTVT">Sở Giao thông Vận tải</option>
            <option value="SO_TNMT">Sở Tài nguyên & Môi trường</option>
            <option value="SO_XD">Sở Xây dựng</option>
            <option value="SO_YTE">Sở Y tế</option>
            <option value="SO_GDDT">Sở Giáo dục & Đào tạo</option>
            <option value="SO_LDTBXH">Sở Lao động - Thương binh & Xã hội</option>
            <option value="CONG_AN_TINH">Công an Tỉnh Đồng Nai</option>
            <option value="BO_PHAN_MOT_CUA">Ban Tiếp công dân Tỉnh</option>
            <option value="UBND_CAP_HUYEN">UBND Cấp Huyện / TP</option>
            <option value="REQUIRE_HUMAN_REVIEW">Tổ Tiếp nhận & Điều phối Đơn thư Tỉnh</option>
          </select>
        </div>
      </div>

      {/* Tùy chọn Tệp đính kèm */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-gov-blue" />
          Đính Kèm Tệp Văn Bản (.pdf, .docx, .txt, .md):
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => setIngestFile(e.target.files[0] || null)}
            className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gov-blue file:text-white hover:file:bg-blue-900 cursor-pointer text-slate-600"
          />
          {ingestFile && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ✓ Đã chọn: {ingestFile.name} ({Math.round(ingestFile.size / 1024)} KB)
            </span>
          )}
        </div>
      </div>

      {/* Nhập nội dung văn bản trực tiếp */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700 uppercase">
          Hoặc Dán Nội Dung Văn Bản Quy Định Tại Đây:
        </label>
        <textarea
          rows={7}
          value={ingestContent}
          onChange={(e) => setIngestContent(e.target.value)}
          placeholder="Dán nội dung các điều khoản, quyết định, quy định của UBND tỉnh Đồng Nai vào đây..."
          className="gov-input font-mono text-xs leading-relaxed p-3 bg-white"
        />
      </div>

      <div className="flex justify-end gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleClear}
          className="gov-btn-secondary text-xs py-2 px-3.5"
        >
          Xóa Trắng
        </button>
        <button
          type="submit"
          disabled={isIngesting}
          className="gov-btn-primary text-xs py-2 px-5 font-semibold shadow-xs flex items-center gap-1.5"
        >
          <FileCheck className="w-4 h-4 text-amber-300" />
          <span>{isIngesting ? 'Đang Lưu Trữ Vào CSDL...' : 'Lưu Vào Kho Văn Bản Pháp Luật'}</span>
        </button>
      </div>
    </form>
  );
}

RAGIngestForm.propTypes = {
  onSuccess: PropTypes.func,
  onToast: PropTypes.func,
};

