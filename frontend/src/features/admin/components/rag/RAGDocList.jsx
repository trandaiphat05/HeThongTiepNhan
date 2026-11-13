import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Filter, Search, RefreshCw, BookOpen, Plus, Trash2, 
  ChevronUp, ChevronDown 
} from 'lucide-react';
import { api } from '../../../../services/api';

/**
 * Bảng hiển thị danh mục các điều khoản RAG đã nạp vào CSDL SQL Server
 * 
 * @param {Object} props
 * @param {Array} props.docs - Danh sách điều khoản
 * @param {boolean} props.loading - Trạng thái nạp dữ liệu
 * @param {string} props.category - Lĩnh vực đang lọc
 * @param {string} props.searchQuery - Từ khóa tìm kiếm
 * @param {(cat: string, q: string) => void} props.onFilterChange - Callback thay đổi bộ lọc
 * @param {() => void} props.onRefresh - Callback làm mới danh sách
 * @param {() => void} props.onSwitchToIngest - Chuyển sang tab nạp mới
 * @param {(type: 'success' | 'warning', message: string) => void} props.onToast - Thông báo toast
 */
export default function RAGDocList({ 
  docs = [], 
  loading = false, 
  category = 'ALL', 
  searchQuery = '', 
  onFilterChange, 
  onRefresh, 
  onSwitchToIngest,
  onToast 
}) {
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const categories = ['ALL', 'SO_GTVT', 'SO_TNMT', 'SO_XD', 'UBND_CAP_HUYEN', 'CHUNG'];

  const categoryLabels = {
    ALL: 'Tất Cả',
    SO_GTVT: 'Sở GTVT',
    SO_TNMT: 'Sở TN&MT',
    SO_XD: 'Sở Xây Dựng',
    UBND_CAP_HUYEN: 'UBND Huyện/TP',
    CHUNG: 'Quy Định Chung',
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onFilterChange) onFilterChange(category, localSearch);
  };

  const handleCategoryClick = (cat) => {
    if (onFilterChange) onFilterChange(cat, localSearch);
  };

  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa văn bản / điều luật "${title}" (ID: ${docId}) khỏi hệ thống?`)) {
      return;
    }
    try {
      await api.deleteRAGDoc(docId);
      if (onToast) onToast('success', `Đã xóa thành công văn bản điều luật ID ${docId}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Lỗi xóa điều luật: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-4">
      {/* Bộ lọc và tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-gov-blue" />
            Lĩnh vực:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                category === cat
                  ? 'bg-gov-blue text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Tìm theo điều khoản..."
                className="gov-input pl-8 py-1.5 text-xs w-48 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gov-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gov-blue ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Đang tải...' : 'Lọc'}</span>
            </button>
          </form>

          <button
            type="button"
            onClick={onSwitchToIngest}
            className="gov-btn-primary text-xs py-1.5 px-3.5 font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm Văn Bản Luật Mới</span>
          </button>
        </div>
      </div>

      {/* Danh sách các đoạn luật */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-gov-blue" />
          <span>Đang nạp danh sách văn bản quy định từ CSDL...</span>
        </div>
      ) : docs.length === 0 ? (
        <div className="py-10 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-300 space-y-2.5">
          <BookOpen className="w-9 h-9 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-medium text-sm">Chưa có văn bản quy phạm pháp luật nào phù hợp.</p>
          <button
            type="button"
            onClick={onSwitchToIngest}
            className="gov-btn-primary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm Văn Bản Luật Mới</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {docs.map((doc) => {
            const isExpanded = expandedDocId === doc.doc_id;
            return (
              <div
                key={doc.doc_id}
                className="bg-white rounded-lg border border-slate-200/80 hover:border-gov-blue/50 transition-all p-3.5 shadow-2xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{doc.doc_id}</span>
                    <span className="font-semibold text-sm text-gov-blue line-clamp-1">{doc.title}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-gov-blue border border-blue-200">
                      {categoryLabels[doc.category] || doc.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                    <span>{doc.char_count} ký tự</span>
                    <span>•</span>
                    <span>{doc.created_at || 'Đã lưu'}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.doc_id, doc.title)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors ml-1.5"
                      title="Xóa đoạn luật này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line bg-slate-50/60 p-2.5 rounded border border-slate-100">
                  {isExpanded ? doc.regulation_content : doc.content_preview}
                </div>

                {doc.regulation_content && doc.regulation_content.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setExpandedDocId(isExpanded ? null : doc.doc_id)}
                    className="text-[11px] font-semibold text-gov-blue hover:underline flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Thu gọn</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Xem toàn bộ đoạn điều luật ({doc.char_count} ký tự)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

RAGDocList.propTypes = {
  docs: PropTypes.array,
  loading: PropTypes.bool,
  category: PropTypes.string,
  searchQuery: PropTypes.string,
  onFilterChange: PropTypes.func,
  onRefresh: PropTypes.func,
  onSwitchToIngest: PropTypes.func,
  onToast: PropTypes.func,
};

