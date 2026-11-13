import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BookOpen, Layers, FileUp, FileText } from 'lucide-react';
import { api } from '../../../services/api';
import RAGDocList from './rag/RAGDocList';
import RAGIngestForm from './rag/RAGIngestForm';
import RAGSearchTest from './rag/RAGSearchTest';
import RAGRawEditor from './rag/RAGRawEditor';

/**
 * Tab Quản lý Kho Tri Thức Pháp Luật RAG
 * 
 * @param {Object} props
 * @param {(type: 'success' | 'warning', message: string) => void} props.onToast - Thông báo toast
 */
export default function RAGManagementTab({ onToast }) {
  const [ragSubTab, setRagSubTab] = useState('list'); // 'list' | 'ingest' | 'test' | 'raw'
  const [ragDocs, setRagDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [filterCat, setFilterCat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
    setRagSubTab('list');
  };

  const subTabs = [
    { id: 'list', label: `Kho Văn Bản Luật (${ragDocs.length})`, icon: Layers },
    { id: 'ingest', label: '+ Thêm Văn Bản Luật Mới', icon: FileUp },
    { id: 'test', label: 'Tra Cứu Văn Bản Luật', icon: BookOpen },
    { id: 'raw', label: 'Soạn Thảo Trực Tiếp', icon: FileText },
  ];

  return (
    <div className="gov-card p-5 sm:p-6 space-y-4">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gov-blue" />
            Kho Văn Bản Quy Phạm Pháp Luật
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cơ sở dữ liệu văn bản quy phạm pháp luật phục vụ tra cứu và viện dẫn căn cứ trả lời công dân.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {subTabs.map((st) => {
            const Icon = st.icon;
            const isActive = ragSubTab === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setRagSubTab(st.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gov-blue text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${st.id === 'test' && isActive ? 'text-amber-300' : ''}`} />
                <span>{st.label}</span>
              </button>
            );
          })}
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
          onRefresh={() => fetchDocs(filterCat, searchQuery)}
          onSwitchToIngest={() => setRagSubTab('ingest')}
          onToast={onToast}
        />
      )}

      {ragSubTab === 'ingest' && (
        <RAGIngestForm
          onSuccess={handleIngestSuccess}
          onToast={onToast}
        />
      )}

      {ragSubTab === 'test' && (
        <RAGSearchTest />
      )}

      {ragSubTab === 'raw' && (
        <RAGRawEditor
          onSuccess={() => fetchDocs()}
          onToast={onToast}
        />
      )}
    </div>
  );
}

RAGManagementTab.propTypes = {
  onToast: PropTypes.func,
};

