import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, ArrowRightLeft, 
  Trash2, AlertCircle, RefreshCw, BarChart3, Building2, 
  Car, Trees, Hammer, Landmark, TrendingUp, FileText, CheckCheck, XCircle
} from 'lucide-react';
import { api } from '../../../services/api';
import { formatSourceLabel } from '../../../utils/formatters';
import { ALL_DEPARTMENTS, getDepartmentName } from '../../../constants/departments';

/**
 * Component Giám sát Hệ thống & Hàng đợi Hồ sơ Ngoại lệ (REQUIRE_HUMAN_REVIEW)
 * Đáp ứng chuẩn phân quyền Admin: Giám sát toàn diện số liệu các Sở ban ngành,
 * tỷ lệ AI định tuyến tự động thành công và điều phối các đơn ngoại lệ/đơn rác.
 * 
 * @param {Object} props
 * @param {(type: 'success' | 'warning', message: string) => void} props.onToast - Callback kích hoạt thông báo toast
 */
export default function ExceptionQueueTab({ onToast }) {
  const [exceptions, setExceptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dispatchTargets, setDispatchTargets] = useState({});
  const [dispatchNotes, setDispatchNotes] = useState({});
  const [actionProcessing, setActionProcessing] = useState(false);

  // 1. Tải số liệu thống kê giám sát hệ thống
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.getSystemStats();
      setStats(data);
    } catch (err) {
      console.warn('Lỗi tải thống kê hệ thống:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // 2. Tải danh sách đơn ngoại lệ từ CSDL
  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const data = await api.getTickets({ dept_code: 'REQUIRE_HUMAN_REVIEW' });
      const activeExceptions = (data || []).filter(t => t.status !== 'REJECTED');
      setExceptions(activeExceptions);

      const defaultTargets = {};
      activeExceptions.forEach(t => {
        defaultTargets[t.ticket_id] = 'SO_GTVT';
      });
      setDispatchTargets(defaultTargets);
    } catch (err) {
      console.error('Lỗi tải hàng đợi ngoại lệ:', err);
      if (onToast) onToast('warning', 'Không thể tải danh sách hồ sơ ngoại lệ.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchStats(), fetchExceptions()]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Chỉ định đơn vị xử lý lại
  const handleDispatchTicket = async (ticketId) => {
    const targetDept = dispatchTargets[ticketId] || 'SO_GTVT';
    const note = dispatchNotes[ticketId] || '';

    setActionProcessing(true);
    try {
      await api.dispatchException(ticketId, targetDept, note);
      if (onToast) {
        onToast('success', `Đã chỉ định hồ sơ sang đơn vị: ${targetDept}. Hệ thống đã chuyển luồng cho Cán bộ chuyên trách.`);
      }
      await refreshAll();
    } catch (err) {
      alert('Không thể điều phối: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  // Từ chối hồ sơ không hợp lệ
  const handleMarkSpam = async (ticketId) => {
    const confirmReject = window.confirm('Xác nhận từ chối thụ lý hồ sơ này do không hợp lệ theo quy chế tiếp nhận đơn thư?');
    if (!confirmReject) return;

    setActionProcessing(true);
    try {
      await api.markAsSpam(ticketId, 'Hồ sơ không hợp lệ, không thuộc phạm vi tiếp nhận giải quyết');
      if (onToast) {
        onToast('warning', 'Đã chuyển hồ sơ sang trạng thái Từ chối / Không hợp lệ.');
      }
      await refreshAll();
    } catch (err) {
      alert('Lỗi xử lý hồ sơ: ' + err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  const totalCount = stats?.total_tickets || 0;
  const aiConfidence = stats?.ai_avg_confidence_percent;
  const displayAiConfidence = (aiConfidence !== undefined && aiConfidence !== null) ? `${aiConfidence}%` : '—';

  const deptIconMap = {
    SO_GTVT: Car,
    SO_TNMT: Trees,
    SO_XD: Hammer,
    SO_XAYDUNG: Hammer,
    UBND_CAP_HUYEN: Landmark,
    UBND_TINH: Landmark,
    CONG_AN_TINH: ShieldAlert,
    SO_YTE: Building2,
    SO_GDDT: Building2,
    SO_LDTBXH: Building2,
  };

  const deptSubtitleMap = {
    SO_GTVT: 'Hạ tầng & đường bộ',
    SO_TNMT: 'Đất đai, môi trường',
    SO_XD: 'Quy hoạch & trật tự XD',
    SO_XAYDUNG: 'Quy hoạch & trật tự XD',
    CONG_AN_TINH: 'An ninh, trật tự ATXH',
    SO_YTE: 'Y tế, phòng dịch & ATTP',
    SO_GDDT: 'Giáo dục & đào tạo',
    SO_LDTBXH: 'Lao động & an sinh',
    UBND_CAP_HUYEN: 'UBND TP/Huyện thụ lý',
    UBND_TINH: 'UBND Tỉnh trực tiếp',
  };

  const deptEntries = stats?.departments
    ? (Array.isArray(stats.departments)
        ? stats.departments
        : Object.values(stats.departments)
      ).filter((d) => d.code !== 'REQUIRE_HUMAN_REVIEW' && d.code !== 'SO_XAYDUNG')
    : ALL_DEPARTMENTS
        .filter((d) => d.code !== 'REQUIRE_HUMAN_REVIEW')
        .map((d) => ({ code: d.code, name: d.short_name || d.name, count: 0 }));

  return (
    <div className="space-y-6">
      {/* KHỐI 1: THỐNG KÊ GIÁM SÁT HỆ THỐNG THEO TỪNG CƠ QUAN & ĐỘ TIN CẬY AI */}
      <div className="gov-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gov-blue" />
              Thống Kê Tiếp Nhận & Phân Luồng Đơn Thư Toàn Tỉnh Đồng Nai
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Số liệu tổng hợp thời gian thực từ cơ sở dữ liệu tiếp nhận và điều phối tập trung.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshAll}
            disabled={statsLoading || loading}
            className="gov-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto"
            title="Làm mới toàn bộ số liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gov-blue ${(statsLoading || loading) ? 'animate-spin' : ''}`} />
            <span>Cập nhật số liệu</span>
          </button>
        </div>

        {/* Lưới Thẻ Chỉ Số KPI Chuẩn Hóa Hành Chính (Dynamic Department Cards + Tỷ lệ định tuyến tự động) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {/* Card 1: Tổng Tiếp Nhận */}
          <div className="p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-gov-blue bg-white flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-700 text-xs">
              <span className="font-bold">Tổng Hồ Sơ</span>
              <FileText className="w-4 h-4 text-gov-blue" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {statsLoading ? '...' : totalCount}
              </span>
              <span className="text-[11px] text-slate-500 block truncate">Tổng tiếp nhận</span>
            </div>
          </div>

          {/* Dynamic Department Cards */}
          {deptEntries.map((dept) => {
            const IconComp = deptIconMap[dept.code] || Building2;
            const subtitle = deptSubtitleMap[dept.code] || 'Hồ sơ thụ lý';
            return (
              <div 
                key={dept.code} 
                className="p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-gov-blue bg-white flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="flex items-center justify-between text-slate-700 text-xs">
                  <span className="font-bold truncate" title={dept.name}>{dept.name || dept.code}</span>
                  <IconComp className="w-4 h-4 text-gov-blue shrink-0 ml-1" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {statsLoading ? '...' : (dept.count ?? 0)}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate" title={subtitle}>{subtitle}</span>
                </div>
              </div>
            );
          })}

          {/* Card: Tỷ lệ định tuyến tự động */}
          <div className="p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-gov-blue bg-white flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-700 text-xs">
              <span className="font-bold truncate" title="Tỷ lệ định tuyến tự động">Tỷ lệ định tuyến tự động</span>
              <TrendingUp className="w-4 h-4 text-gov-blue shrink-0 ml-1" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {statsLoading ? '...' : displayAiConfidence}
                </span>
                {aiConfidence !== undefined && aiConfidence !== null && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Chính xác
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-gov-blue h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(typeof aiConfidence === 'number' ? aiConfidence : 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI 2: HÀNG ĐỢI HỒ SƠ NGOẠI LỆ / CHỜ PHÂN LUỒNG */}
      <div className="gov-card p-5 sm:p-6 space-y-5">
        {/* Tiêu đề & Bộ đếm */}
        <div className="border-b border-slate-200/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Hàng Đợi Xử Lý Hồ Sơ Chờ Phân Luồng (Ngoại Lệ)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hồ sơ có nội dung giao thoa liên ngành cần Quản trị viên chỉ định cơ quan chủ trì giải quyết.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-900 rounded-full border border-amber-200">
              Chờ Quản trị viên xử lý: {exceptions.length} hồ sơ
            </span>
          </div>
        </div>

        {/* Trạng thái tải */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Đang nạp hồ sơ ngoại lệ từ CSDL...
          </div>
        ) : exceptions.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto mb-2" />
            <div className="font-bold text-base text-slate-800">
              Hàng Đợi Ngoại Lệ Đang Trống
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tất cả đơn thư hiện tại đều đã được phân luồng xử lý và chuyển đến đúng cơ quan chuyên trách thụ lý.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {exceptions.map((item) => {
              const currentTarget = dispatchTargets[item.ticket_id] || 'SO_GTVT';
              const currentNote = dispatchNotes[item.ticket_id] || '';

              return (
                <div
                  key={item.ticket_id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 bg-white space-y-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  {/* Header đơn */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-gov-blue text-sm sm:text-base">
                        {item.tracking_code}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Cần xác định cơ quan chủ trì</span>
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        Nguồn: {formatSourceLabel(item.source)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Tiếp nhận: <span className="text-slate-600 font-medium">{item.created_at}</span>
                    </div>
                  </div>

                  {/* Nội dung phản ánh gốc */}
                  <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80 text-slate-800 text-sm leading-relaxed space-y-1">
                    <span className="text-xs font-semibold uppercase text-slate-500 block">
                      Nội dung công dân phản ánh:
                    </span>
                    <p className="font-normal italic text-slate-700">
                      "{item.raw_text}"
                    </p>
                  </div>

                  {/* Lý do chuyển xử lý thủ công */}
                  <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-semibold flex items-center gap-1 text-amber-800">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Lý do chuyển xử lý thủ công:
                    </span>
                    <p className="leading-relaxed">
                      {item.ai_result?.legal_basis || 'Đơn đa lĩnh vực có sự giao thoa thẩm quyền, cần cán bộ quản trị chỉ định cơ quan chủ trì.'}
                    </p>
                  </div>

                  {/* Hành động điều phối */}
                  <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                      <label className="text-xs font-semibold text-slate-700 shrink-0">
                        Chỉ định đơn vị:
                      </label>
                      <select
                        value={currentTarget}
                        onChange={(e) => setDispatchTargets({
                          ...dispatchTargets,
                          [item.ticket_id]: e.target.value
                        })}
                        className="gov-input py-1.5 text-xs font-semibold text-slate-800 sm:max-w-xs"
                      >
                        {ALL_DEPARTMENTS.filter(d => d.code !== 'REQUIRE_HUMAN_REVIEW').map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) => setDispatchNotes({
                          ...dispatchNotes,
                          [item.ticket_id]: e.target.value
                        })}
                        placeholder="Ghi chú điều phối (vd: Giao Sở Xây dựng chủ trì)..."
                        className="gov-input py-1.5 text-xs flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMarkSpam(item.ticket_id)}
                        disabled={actionProcessing}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="Từ chối thụ lý do hồ sơ không hợp lệ"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                        <span>Từ chối / Không hợp lệ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDispatchTicket(item.ticket_id)}
                        disabled={actionProcessing}
                        className="gov-btn-primary text-xs py-1.5 px-4 font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
                        <span>Điều Phối Lại</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

ExceptionQueueTab.propTypes = {
  onToast: PropTypes.func,
};

