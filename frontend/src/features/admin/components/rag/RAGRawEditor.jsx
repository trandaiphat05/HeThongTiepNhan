import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText, Save } from 'lucide-react';
import { api } from '../../../../services/api';

/**
 * Soạn thảo trực tiếp nội dung tri thức pháp luật toàn hệ thống (Raw Markdown Editor)
 * 
 * @param {Object} props
 * @param {() => void} props.onSuccess - Callback sau khi cập nhật thành công
 * @param {(type: 'success' | 'warning', message: string) => void} props.onToast - Thông báo toast
 */
export default function RAGRawEditor({ onSuccess, onToast }) {
  const [ragText, setRagText] = useState(`## 1. LĨNH VỰC GIAO THÔNG VẬN TẢI (SO_GTVT)
- Luật Giao thông đường bộ 2008 & Nghị định 11/2010/NĐ-CP: Duy tu bảo trì kết cấu hạ tầng đường bộ trên các tuyến Quốc lộ ủy thác (QL1A, QL51, QL20) và Đường tỉnh (ĐT.768, ĐT.769, ĐT.767). Xử lý điểm sụt lún mặt đường, ổ gà lớn, sự cố đèn tín hiệu, xe buýt, phân luồng chống ùn tắc.

## 2. LĨNH VỰC TÀI NGUYÊN VÀ MÔI TRƯỜNG (SO_TNMT)
- Luật Bảo vệ Môi trường 2020 & Nghị định 45/2022/NĐ-CP: Xử lý xả trộm nước thải công nghiệp, nước thải hóa chất chưa xử lý ra kênh rạch và sông Đồng Nai, mùi hôi phát tán từ KCN (Amata, Biên Hòa 2, Nhơn Trạch). Bãi rác tự phát lớn, khai thác cát trái phép, phân lô bán nền sai phạm.

## 3. LĨNH VỰC XÂY DỰNG VÀ THOÁT NƯỚC (SO_XD)
- Luật Xây dựng 2014 (sửa đổi 2020) & Nghị định 16/2022/NĐ-CP: Cấp giấy phép xây dựng dự án, xử lý công trình vi phạm chỉ giới xây dựng, xây sai cốt gây ngập úng đô thị, công trình đào móng thi công gây nứt lún đe dọa sập đổ nhà dân liền kề.

## 4. LĨNH VỰC AN NINH TRẬT TỰ & DÂN SỰ ĐỊA PHƯƠNG (UBND_CAP_HUYEN)
- Nghị định số 144/2021/NĐ-CP & Luật Tổ chức chính quyền địa phương 2015: An ninh trật tự khu phố, xử lý tiếng ồn hát karaoke loa kẹo kéo sau 22h đêm, buôn bán hàng rong lấn chiếm vỉa hè lòng đường, tranh chấp ranh giới dân sự nhỏ trong khu dân cư.`);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateRAGKnowledge(ragText);
      if (onToast) {
        onToast('success', 'Cập nhật kho văn bản luật thành công! Hệ thống đã tự động đồng bộ căn cứ mới.');
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Lỗi lưu kho luật: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3.5 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-gov-blue" />
            Soạn Thảo Trực Tiếp Nội Dung Quy Định:
          </label>
          <span className="text-[11px] text-slate-400">
            Độ dài: {ragText.length} ký tự
          </span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="gov-btn-primary text-xs py-1.5 px-4 font-semibold shadow-xs flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5 text-amber-300" />
          <span>{isSaving ? 'Đang Cập Nhật...' : 'Lưu Thay Đổi'}</span>
        </button>
      </div>

      <textarea
        rows={12}
        value={ragText}
        onChange={(e) => setRagText(e.target.value)}
        className="gov-input font-mono text-xs leading-relaxed p-3.5 bg-white focus:bg-white"
        placeholder="Nhập nội dung quy định, nghị quyết pháp luật của tỉnh Đồng Nai..."
      />
    </div>
  );
}

RAGRawEditor.propTypes = {
  onSuccess: PropTypes.func,
  onToast: PropTypes.func,
};

