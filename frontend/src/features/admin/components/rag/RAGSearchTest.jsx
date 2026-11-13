import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { BookOpen, Search } from 'lucide-react';
import { api } from '../../../../services/api';

/**
 * Khung tra cứu căn cứ văn bản quy phạm pháp luật theo nội dung thực tế
 */
export default function RAGSearchTest() {
  const [testQuery, setTestQuery] = useState('');
  const [testCategory, setTestCategory] = useState('ALL');
  const [testResults, setTestResults] = useState(null);
  const [isSearchingTest, setIsSearchingTest] = useState(false);

  const handleRunSearchTest = async (e) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setIsSearchingTest(true);
    try {
      const res = await api.searchRAGKnowledge(testQuery, testCategory);
      setTestResults(res);
    } catch (err) {
      alert('Lỗi tra cứu: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSearchingTest(false);
    }
  };

  return (
    <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80">
      <div className="border-b border-slate-200/80 pb-3">
        <h4 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-gov-blue" />
          Tra Cứu Căn Cứ Pháp Luật Tương Ứng
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Nhập tình huống phản ánh thực tế của công dân để tra cứu các quy định và điều luật tương ứng.
        </p>
      </div>

      <form onSubmit={handleRunSearchTest} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="vd: Xe chở cát quá tải làm rơi vãi gây bụi mù mịt và sụt lún đường ĐT.768..."
            className="gov-input text-xs sm:text-sm py-2 flex-1"
          />

          <select
            value={testCategory}
            onChange={(e) => setTestCategory(e.target.value)}
            className="gov-input text-xs sm:text-sm py-2 font-medium text-slate-800 sm:w-44"
          >
            <option value="ALL">Mọi Lĩnh Vực</option>
            <option value="SO_GTVT">Sở Giao thông Vận tải</option>
            <option value="SO_TNMT">Sở Tài nguyên & Môi trường</option>
            <option value="SO_XD">Sở Xây dựng</option>
            <option value="UBND_CAP_HUYEN">UBND Cấp Huyện / TP</option>
          </select>

          <button
            type="submit"
            disabled={isSearchingTest || !testQuery.trim()}
            className="gov-btn-primary text-xs py-2 px-5 font-semibold shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-amber-300" />
            <span>{isSearchingTest ? 'Đang Tra Cứu...' : 'Tìm Căn Cứ Luật'}</span>
          </button>
        </div>
      </form>

      {testResults && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>KẾT QUẢ TRA CỨU: Tìm thấy {testResults.count} căn cứ pháp luật sát nhất</span>
            <span className="text-slate-400 font-normal">Phương thức: Tra cứu văn bản quy định pháp luật</span>
          </div>

          {testResults.matches && testResults.matches.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5">
              {testResults.matches.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gov-blue flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {item.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-gov-blue border border-blue-200">
                        {item.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Độ tương thích: {item.relevance_score}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded whitespace-pre-line border border-slate-100 font-sans">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
              Không tìm thấy điều khoản nào khớp với từ khóa tìm kiếm.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

RAGSearchTest.propTypes = {};

