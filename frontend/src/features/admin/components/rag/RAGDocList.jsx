import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Filter, Search, RefreshCw, BookOpen, Trash2, 
  ChevronUp, ChevronDown 
} from 'lucide-react';
import { api } from '../../../../services/api';
import ConfirmModal from '../../../../components/common/ConfirmModal';

/**
 * Bảng hiển thị danh mục các điều khoản RAG đã nạp vào CSDL
 */
export default function RAGDocList({ 
  docs = [], 
  loading = false, 
  category = 'ALL', 
  searchQuery = '', 
  onFilterChange, 
  onRefresh, 
  onOpenCreateModal,
  onToast 
}) {
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = [
    'ALL',
    'CHUNG',
    'SO_GTVT',
    'SO_TNMT',
    'SO_XD',
    'SO_YTE',
    'SO_GDDT',
    'SO_LDTBXH',
    'CONG_AN_TINH',
    'BO_PHAN_MOT_CUA',
    'UBND_CAP_HUYEN',
    'REQUIRE_HUMAN_REVIEW',
  ];

  const categoryLabels = {
    ALL: 'Tất Cả',
    CHUNG: 'Quy Định Chung',
    SO_GTVT: 'Sở GTVT',
    SO_TNMT: 'Sở TN&MT',
    SO_XD: 'Sở Xây Dựng',
    SO_XAYDUNG: 'Sở Xây Dựng',
    SO_YTE: 'Sở Y tế',
    SO_GDDT: 'Sở GD&ĐT',
    SO_LDTBXH: 'Sở LĐ-TB&XH',
    CONG_AN_TINH: 'Công an Tỉnh',
    BO_PHAN_MOT_CUA: 'Ban Tiếp công dân Tỉnh',
    UBND_CAP_HUYEN: 'UBND Cấp Huyện / TP',
    REQUIRE_HUMAN_REVIEW: 'Điều Phối Ngoại Lệ',
  };

  const cleanTitle = (rawTitle) => {
    if (!rawTitle) return '';
    return rawTitle
      .replace(/\s*\(['"]?([A-Z_]{2,35})['"]?\)/gi, '')
      .replace(/^Quy Định Phân Cấp Hành Chính & Thẩm Quyền Tỉnh Đồng Nai\s*-\s*/, '')
      .trim();
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onFilterChange) onFilterChange(category, localSearch);
  };

  const handleCategoryClick = (cat) => {
    if (onFilterChange) onFilterChange(cat, localSearch);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteRAGDoc(deleteTarget.id);
      if (onToast) onToast('success', `Đã xóa thành công văn bản điều luật ID ${deleteTarget.id}`);
      setDeleteTarget(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onToast) onToast('warning', 'Lỗi xóa điều luật: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bộ lọc và tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-[#E2E8F0]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-[#5F6368] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#0B57D0]" />
            Lĩnh vực:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                category === cat
                  ? 'bg-[#0B57D0] text-white shadow-xs'
                  : 'bg-white border border-[#E2E8F0] text-[#5F6368] hover:bg-slate-100'
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
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-full focus:outline-none focus:border-[#0B57D0] w-48 sm:w-60"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5F6368]" />
            </div>
            <button
              type="submit"
              className="bg-[#0B57D0] text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-[#0842A0] transition-colors"
            >
              Tìm
            </button>
          </form>

          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded-full border border-[#E2E8F0] bg-white text-[#5F6368] hover:text-[#1F1F1F] hover:bg-slate-100 transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Danh sách các điều khoản */}
      {loading ? (
        <div className="py-12 text-center text-[#5F6368] text-xs space-y-2">
          <div className="w-6 h-6 border-2 border-[#0B57D0] border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Đang tải kho văn bản pháp luật...</div>
        </div>
      ) : docs.length === 0 ? (
        <div className="py-12 text-center text-[#5F6368] text-xs space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-[#E2E8F0]">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="font-semibold text-[#1F1F1F]">Chưa có văn bản điều luật nào</div>
          <p className="text-[11px]">Bấm "+ Thêm văn bản luật" để nạp văn bản quy phạm mới.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const docId = doc.doc_id || doc.id;
            const isExpanded = expandedDocId === docId;
            return (
              <div
                key={doc.doc_id || doc.id}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-white hover:bg-slate-50/50"
                  onClick={() => setExpandedDocId(isExpanded ? null : docId)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] font-bold text-[#0B57D0] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                      ID: {docId}
                    </span>
                    <span className="text-xs font-bold text-[#1F1F1F] truncate">
                      {cleanTitle(doc.title)}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#5F6368] shrink-0">
                      {categoryLabels[doc.category] || doc.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ id: doc.doc_id || doc.id, title: cleanTitle(doc.title) });
                      }}
                      className="p-1 rounded text-[#5F6368] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa điều khoản này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#5F6368]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#5F6368]" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-3 border-t border-[#E2E8F0] bg-slate-50/70 text-xs text-[#1F1F1F] leading-relaxed whitespace-pre-line font-sans">
                    {doc.content || doc.regulation_content || 'Chưa có nội dung chi tiết cho điều khoản này.'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CenterModal Confirm Dialog for deleting law */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa văn bản quy phạm"
        message={
          <>
            Bạn có chắc chắn muốn xóa văn bản/điều luật{' '}
            <strong className="text-[#1F1F1F]">"{deleteTarget?.title}"</strong> (ID:{' '}
            {deleteTarget?.id}) khỏi cơ sở dữ liệu? Thao tác này không thể hoàn tác.
          </>
        }
        confirmText="Xóa vĩnh viễn"
        isDanger={true}
        isLoading={isDeleting}
      />
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
  onOpenCreateModal: PropTypes.func,
  onToast: PropTypes.func,
};
