import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BookOpen, Layers, Plus, FileText, Search } from 'lucide-react';
import { api } from '../../../services/api';
import RAGDocList from './rag/RAGDocList';
import RAGIngestForm from './rag/RAGIngestForm';
import RAGSearchTest from './rag/RAGSearchTest';
import RAGRawEditor from './rag/RAGRawEditor';
import CenterModal from '../../../components/common/CenterModal';

/**
 * Tab Quản lý Kho Tri Thức Pháp Luật RAG
 * Tích hợp CenterModal nạp văn bản luật mới
 */
export default function RAGManagementTab({ onToast }) {
  const [ragSubTab, setRagSubTab] = useState('list'); // 'list' | 'test' | 'raw'
  const [ragDocs, setRagDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [filterCat, setFilterCat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchDocs = async (cat = filterCat, q = searchQuery) => {
    setLoadingDocs(true);
    try {
      const data = await api.getRAGDocs({
        category: cat !== 'ALL' ? cat : undefined,
        search: q.trim() || undefined,
        limit: 100,
      });
      setRagDocs(data || []);
    } catch (err) {
      console.error('Lỗi tải tài liệu RAG:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs(filterCat, searchQuery);
  }, [filterCat]);

  const handleFilterChange = (cat, q) => {
    setFilterCat(cat);
    setSearchQuery(q);
    fetchDocs(cat, q);
  };

  const handleIngestSuccess = async () => {
    await fetchDocs();
    setIsCreateModalOpen(false);
  };

  const subTabs = [
    { id: 'list', label: `Kho Văn Bản (${ragDocs.length})`, icon: Layers },
    { id: 'test', label: 'Tra Cứu Văn Bản', icon: Search },
    { id: 'raw', label: 'Soạn Thảo Trực Tiếp', icon: FileText },
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0B57D0]" />
            <span>Kho Văn Bản Quy Phạm Pháp Luật</span>
          </h3>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Cơ sở dữ liệu pháp luật tra cứu và đối chiếu thẩm quyền giải quyết phản ánh kiến nghị.
          </p>
        </div>

        {/* Action button & Sub-tab Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#C2E7FF] hover:bg-[#b2defc] text-[#001D35] px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Văn Bản Luật</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-[#E2E8F0]">
            {subTabs.map((st) => {
              const Icon = st.icon;
              const isActive = ragSubTab === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setRagSubTab(st.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-[#0B57D0] shadow-xs'
                      : 'text-[#5F6368] hover:text-[#1F1F1F]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-tab Views */}
      {ragSubTab === 'list' && (
        <RAGDocList
          docs={ragDocs}
          loading={loadingDocs}
          category={filterCat}
          searchQuery={searchQuery}
          onFilterChange={handleFilterChange}
          onRefresh={fetchDocs}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onToast={onToast}
        />
      )}

      {ragSubTab === 'test' && (
        <RAGSearchTest />
      )}

      {ragSubTab === 'raw' && (
        <RAGRawEditor onSuccess={fetchDocs} onToast={onToast} />
      )}

      {/* CenterModal for Creating RAG Law Document */}
      <CenterModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth="max-w-2xl"
        title="Thêm Văn Bản Quy Phạm Pháp Luật Mới"
        subtitle="Tải tệp hoặc nhập nội dung để hệ thống lưu trữ điều khoản vào cơ sở dữ liệu"
      >
        <RAGIngestForm onSuccess={handleIngestSuccess} onToast={onToast} />
      </CenterModal>
    </div>
  );
}

RAGManagementTab.propTypes = {
  onToast: PropTypes.func,
};
