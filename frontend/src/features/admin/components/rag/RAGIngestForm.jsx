import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { FileUp, Upload, FileCheck } from 'lucide-react';
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
  const [isIngesting, setIsIngesting] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ingestContent.trim() && !ingestFile) {
      alert('Vui lòng nhập nội dung văn bản hoặc chọn tệp đính kèm (.pdf, .docx, .txt, .md).');
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
      alert('Lỗi nạp văn bản: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsIngesting(false);
    }
  };

  const handleClear = () => {
    setIngestTitle('');
    setIngestContent('');
    setIngestFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80">
      <div className="border-b border-slate-200/80 pb-3">
        <h4 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-1.5">
          <FileUp className="w-4 h-4 text-gov-blue" />
          Nạp Văn Bản Quy Phạm Pháp Luật Mới
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Tải lên tệp văn bản pháp luật (.pdf, .docx, .txt, .md) hoặc nhập văn bản. Hệ thống tự động phân tách theo từng Điều/Khoản lưu trữ vào CSDL.
        </p>
      </div>

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
            <option value="CHUNG">Quy định chung - Phân cấp hành chính Tỉnh</option>
            <option value="SO_GTVT">Sở Giao thông Vận tải</option>
            <option value="SO_TNMT">Sở Tài nguyên & Môi trường</option>
            <option value="SO_XD">Sở Xây dựng & Phát triển đô thị</option>
            <option value="UBND_CAP_HUYEN">UBND Cấp Huyện / TP</option>
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

