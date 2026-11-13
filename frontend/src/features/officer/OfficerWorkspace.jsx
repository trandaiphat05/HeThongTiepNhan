import React, { useState, useEffect } from 'react';
import {
  Briefcase, RefreshCw, CheckCircle2, AlertTriangle,
  Building2, X, Clock, ArrowRightLeft, User, Phone, Mail, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatSourceLabel, formatDeptName } from '../../utils/formatters';
import TicketListTable from './components/TicketListTable';
import AiAnalysisCard from './components/AiAnalysisCard';
import DraftResponseEditor from './components/DraftResponseEditor';
import ReassignModal from './components/ReassignModal';

/**
 * Bàn Làm Việc Thẩm Định & Phê Duyệt Cán Bộ (OfficerWorkspace - Refactored Orchestrator)
 */
export default function OfficerWorkspace() {
  const { user } = useAuth();

  // 1. Bộ lọc danh sách (Mặc định lọc theo đơn vị của Cán bộ nếu có)
  const initialDept = (user?.department_code && user.department_code !== 'ADMIN' && user.department_code !== 'UBND_TINH')
    ? user.department_code
    : 'ALL';
  const [selectedDept, setSelectedDept] = useState(initialDept);
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Tự động đồng bộ bộ lọc khi đổi tài khoản
  useEffect(() => {
    if (user?.department_code && user.department_code !== 'ADMIN' && user.department_code !== 'UBND_TINH') {
      setSelectedDept(user.department_code);
    } else if (user?.role === 'ADMIN') {
      setSelectedDept('ALL');
    }
  }, [user?.department_code, user?.role]);

  // 2. Dữ liệu hồ sơ
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // 3. Trạng thái biên tập & phê duyệt
  const [editedExtractedText, setEditedExtractedText] = useState('');
  const [editedDraftReply, setEditedDraftReply] = useState('');
  const [assignedDept, setAssignedDept] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [notification, setNotification] = useState(null);

  // 4. Trạng thái Reassign Modal (Human Override)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignDept, setReassignDept] = useState('SO_GTVT');
  const [reassignReason, setReassignReason] = useState('');

  // Danh mục danh sách lọc
  const departments = [
    { code: 'ALL', name: 'Tất Cả Các Đơn Vị' },
    { code: 'SO_GTVT', name: 'Sở Giao thông Vận tải' },
    { code: 'SO_TNMT', name: 'Sở Tài nguyên & Môi trường' },
    { code: 'SO_XD', name: 'Sở Xây dựng' },
    { code: 'SO_YTE', name: 'Sở Y tế' },
    { code: 'SO_GDDT', name: 'Sở Giáo dục & Đào tạo' },
    { code: 'SO_LDTBXH', name: 'Sở Lao động - Thương binh & Xã hội' },
    { code: 'CONG_AN_TINH', name: 'Công an Tỉnh Đồng Nai' },
    { code: 'UBND_CAP_HUYEN', name: 'UBND Cấp Huyện / TP' },
    { code: 'REQUIRE_HUMAN_REVIEW', name: 'Cần Phân Luồng Thủ Công' },
  ];

  const sources = [
    { code: 'ALL', name: 'Mọi Kênh Tiếp Nhận' },
    { code: 'EMAIL', name: 'Thư Điện Tử (Gmail)' },
    { code: 'WEB_TEXT', name: 'Cổng DVC Trực Tuyến' },
    { code: 'ONE_STOP', name: 'Trực Tiếp / Một Cửa' },
  ];

  const priorities = [
    { code: 'ALL', name: 'Mọi Mức Ưu Tiên' },
    { code: 'CAO', name: 'Ưu Tiên: Khẩn / Cao' },
    { code: 'TRUNG_BINH', name: 'Ưu Tiên: Trung Bình' },
    { code: 'THAP', name: 'Ưu Tiên: Tiêu Chuẩn' },
  ];

  // Tải danh sách hồ sơ từ API
  const fetchTickets = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.getTickets({
        dept_code: selectedDept,
        source: selectedSource,
        priority: selectedPriority,
        search: searchQuery,
      });

      setTickets(data);

      if (data.length > 0) {
        if (!selectedTicket || !data.some(t => t.ticket_id === selectedTicket.ticket_id)) {
          selectTicketForReview(data[0]);
        }
      } else {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách hồ sơ:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedDept, selectedSource, selectedPriority, searchQuery]);

  // Chọn hồ sơ để đối chiếu
  const selectTicketForReview = (ticket) => {
    setSelectedTicket(ticket);
    setEditedExtractedText(ticket.ai_result?.extracted_text || ticket.raw_text || '');
    setEditedDraftReply(ticket.ai_result?.draft_reply || '');
    setAssignedDept(ticket.dept_code || 'UBND_CAP_HUYEN');
  };

  // Nạp thể thức văn bản hành chính Việt Nam chuẩn (Nghị định 30/2020/NĐ-CP)
  const applyOfficialGovTemplate = () => {
    if (!selectedTicket) return;
    const dept = assignedDept || selectedTicket.dept_code || 'UBND_CAP_HUYEN';
    const deptHeaders = {
      SO_GTVT: ['SỞ GIAO THÔNG VẬN TẢI TỈNH ĐỒNG NAI', 'Số: .../TB-SGTVT'],
      SO_TNMT: ['SỞ TÀI NGUYÊN VÀ MÔI TRƯỜNG TỈNH ĐỒNG NAI', 'Số: .../TB-STNMT'],
      SO_XD: ['SỞ XÂY DỰNG TỈNH ĐỒNG NAI', 'Số: .../TB-SXD'],
      SO_XAYDUNG: ['SỞ XÂY DỰNG TỈNH ĐỒNG NAI', 'Số: .../TB-SXD'],
      SO_YTE: ['SỞ Y TẾ TỈNH ĐỒNG NAI', 'Số: .../TB-SYT'],
      SO_YT: ['SỞ Y TẾ TỈNH ĐỒNG NAI', 'Số: .../TB-SYT'],
      SO_GDDT: ['SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI', 'Số: .../TB-SGDĐT'],
      SO_GD: ['SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI', 'Số: .../TB-SGDĐT'],
      SO_LDTBXH: ['SỞ LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI TỈNH ĐỒNG NAI', 'Số: .../TB-SLĐTBXH'],
      SO_LD: ['SỞ LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI TỈNH ĐỒNG NAI', 'Số: .../TB-SLĐTBXH'],
      CONG_AN_TINH: ['CÔNG AN TỈNH ĐỒNG NAI', 'Số: .../TB-CAT'],
      UBND_TINH: ['ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI', 'Số: .../TB-UBND'],
      UBND_CAP_HUYEN: ['ỦY BAN NHÂN DÂN CẤP HUYỆN / TP', 'Số: .../TB-UBND'],
      REQUIRE_HUMAN_REVIEW: ['TỔ TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ TỈNH ĐỒNG NAI', 'Số: .../TB-TĐP']
    };
    const [orgName, docNo] = deptHeaders[dept] || ['ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI', 'Số: .../TB-UBND'];
    const today = new Date();
    const citizenName = selectedTicket.citizen_name || 'Quý công dân';

    const template = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-------------------------------

${orgName}
${docNo}                               Đồng Nai, ngày ${today.getDate().toString().padStart(2, '0')} tháng ${(today.getMonth() + 1).toString().padStart(2, '0')} năm ${today.getFullYear()}

THÔNG BÁO
V/v trả lời phản ánh, kiến nghị của công dân ${citizenName}
(Mã hồ sơ: ${selectedTicket.tracking_code})

Kính gửi: Ông/Bà ${citizenName},

- Căn cứ pháp lý: ${selectedTicket.ai_result?.legal_basis || 'Luật Khiếu nại 2011, Luật Tiếp công dân 2013 và các quy định pháp luật chuyên ngành'};
- Xét nội dung phản ánh: "${selectedTicket.ai_result?.summary || selectedTicket.raw_text}".

${orgName} thông báo nội dung xử lý/hướng dẫn cụ thể như sau:
1. Đã tiếp nhận nội dung và cử tổ thanh tra chuyên ngành kiểm tra thực địa hiện trường.
2. Biện pháp xử lý: Cơ quan đã yêu cầu các bên liên quan khắc phục dứt điểm theo đúng quy định pháp luật.
3. Thời hạn hoàn thành: Kết quả xử lý cụ thể sẽ được thông báo đến công dân trong thời hạn 05 ngày làm việc.

Nơi nhận:
- Công dân ${citizenName} (để biết);
- Ban Giám đốc Sở;
- Lưu: VT, Tổ Tiếp nhận đơn thư.`;

    setEditedDraftReply(template);
  };

  // Mở modal điều chuyển cơ quan thụ lý thủ công
  const handleOpenReassignModal = () => {
    if (!selectedTicket) return;
    setReassignDept(selectedTicket.dept_code || 'SO_GTVT');
    setReassignReason('');
    setIsReassignModalOpen(true);
  };

  // Xác nhận chuyển cơ quan thụ lý (PUT /api/tickets/{id}/reassign)
  const handleConfirmReassign = async () => {
    if (!selectedTicket) return;
    if (!reassignReason.trim()) {
      alert('Vui lòng nhập lý do chuyển cơ quan thụ lý theo quy định kiểm toán.');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await api.reassignTicket(selectedTicket.ticket_id, {
        department_code: reassignDept,
        reason: reassignReason.trim(),
        reassigned_by: 'Cán bộ thụ lý',
      });

      const updatedDept = res.department_code || reassignDept;
      const updatedDeptName = res.dept_name || reassignDept;

      setSelectedTicket(prev => ({
        ...prev,
        dept_code: updatedDept,
        department_code: updatedDept,
        dept_name: updatedDeptName,
        admin_note: res.admin_note || prev.admin_note,
      }));
      setAssignedDept(updatedDept);

      setNotification({
        type: 'success',
        text: `Đã chuyển cơ quan thụ lý hồ sơ ${selectedTicket.tracking_code} sang ${updatedDeptName} thành công!`
      });
      setIsReassignModalOpen(false);
      await fetchTickets(true);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      alert('Lỗi khi chuyển cơ quan thụ lý: ' + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  // Cán bộ lưu tạm thời các thay đổi
  const handleSaveDraft = () => {
    if (!selectedTicket) return;
    setNotification({
      type: 'success',
      text: `Đã lưu tạm thời các chỉnh sửa cho hồ sơ ${selectedTicket.tracking_code}.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Cán bộ duyệt đơn & phát hành phản hồi
  const handleApprove = async () => {
    if (!selectedTicket) return;
    setIsSubmittingApproval(true);

    try {
      await api.approveTicket(selectedTicket.ticket_id, {
        draft_reply: editedDraftReply,
        extracted_text: editedExtractedText,
        department_code: assignedDept,
      });

      setNotification({
        type: 'success',
        text: `Đã phê duyệt và phát hành phản hồi chính thức cho hồ sơ ${selectedTicket.tracking_code}. Hệ thống đã gửi email thông báo cho công dân.`,
      });

      await fetchTickets(true);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      alert('Không thể phê duyệt hồ sơ: ' + err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Báo cáo chuyển tuyến về Admin xử lý ngoại lệ
  const handleTransfer = async () => {
    if (!selectedTicket) return;
    const confirmTransfer = window.confirm(
      `Bạn có chắc chắn muốn chuyển hồ sơ ${selectedTicket.tracking_code} sang hàng đợi Admin xử lý ngoại lệ?`
    );
    if (!confirmTransfer) return;

    setIsTransferring(true);
    try {
      await api.transferTicket(selectedTicket.ticket_id, {
        target_dept: 'REQUIRE_HUMAN_REVIEW',
        notes: 'Chuyển về Hàng đợi Admin xử lý ngoại lệ',
      });
      setNotification({
        type: 'warning',
        text: `Đã chuyển hồ sơ ${selectedTicket.tracking_code} về Hàng đợi Admin xử lý ngoại lệ.`,
      });
      await fetchTickets(true);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      alert('Lỗi chuyển tuyến: ' + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  // Tính số lượng hồ sơ chờ thẩm định
  const pendingCount = tickets.filter(t => t.status !== 'APPROVED').length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* ===================== 1. HEADER CHÍNH CỦA BÀN LÀM VIỆC ===================== */}
      <div className="gov-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-50 text-gov-blue text-xs font-semibold px-2.5 py-0.5 rounded-md border border-blue-100">
                Hệ Thống Nghiệp Vụ Cán Bộ
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Cơ sở dữ liệu tiếp nhận & điều phối tập trung
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Bàn Làm Việc Thẩm Định & Phê Duyệt Đơn Thư
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Chờ thẩm định: <strong className="text-amber-950 font-bold">{pendingCount}</strong> hồ sơ</span>
            </div>

            <button
              type="button"
              onClick={() => fetchTickets(true)}
              disabled={isRefreshing}
              className="gov-btn-secondary text-sm py-2 px-3.5 cursor-pointer"
              title="Làm mới dữ liệu từ CSDL"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-gov-blue' : ''}`} />
              <span>{isRefreshing ? 'Đang Tải...' : 'Làm Mới'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Thông báo Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm font-medium shadow-xs ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================== 2. BỐ CỤC MASTER-DETAIL (4/12 & 8/12) ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* CỘT TRÁI (4/12): DANH SÁCH ĐƠN THƯ & BỘ LỌC ĐA TIÊU CHÍ */}
        <TicketListTable
          tickets={tickets}
          selectedTicket={selectedTicket}
          onSelectTicket={selectTicketForReview}
          selectedDept={selectedDept}
          setSelectedDept={setSelectedDept}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          loading={loading}
          isRefreshing={isRefreshing}
          onRefresh={fetchTickets}
          departments={departments}
          sources={sources}
          priorities={priorities}
        />

        {/* CỘT PHẢI (8/12): CHI TIẾT ĐỐI CHIẾU & PHÊ DUYỆT */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col h-[calc(100vh-250px)] min-h-[620px] overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Header Hồ Sơ Đang Chọn */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Hồ Sơ:
                    </span>
                    <span className="text-base font-mono font-bold text-gov-blue">
                      {selectedTicket.tracking_code}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-medium">
                      {formatSourceLabel(selectedTicket.source)}
                    </span>
                    {selectedTicket.status === 'APPROVED' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                        Đã Phê Duyệt
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {selectedTicket.citizen_name || 'Khuyết danh'}
                    </span>
                    {selectedTicket.citizen_phone && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedTicket.citizen_phone}
                      </span>
                    )}
                    {selectedTicket.citizen_email && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedTicket.citizen_email}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {selectedTicket.created_at}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Mức độ ưu tiên:</span>
                  {selectedTicket.priority === 'CAO' ? (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      KHẨN CẤP
                    </span>
                  ) : selectedTicket.priority === 'TRUNG_BINH' ? (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      ƯU TIÊN
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      BÌNH THƯỜNG
                    </span>
                  )}
                </div>
              </div>

              {/* Banner Cơ Quan Do Hệ Thống Đề Xuất & Nút Chuyển Tuyến Thủ Công */}
              <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-white border-b border-blue-200/70 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gov-blue text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Gợi ý từ hệ thống:
                      </span>
                      <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-200">
                        Tự động phân tuyến
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-gov-blue font-extrabold">
                        {formatDeptName(selectedTicket.dept_code, selectedTicket.dept_name)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenReassignModal}
                  className="gov-btn-secondary text-xs sm:text-sm py-2 px-3.5 font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 shadow-2xs shrink-0"
                  title="Chuyển cơ quan thụ lý thủ công"
                >
                  <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                  <span>🔄 Chuyển Tuyến Thủ Công</span>
                </button>
              </div>

              {/* Nội dung chi tiết cuộn được */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                {/* 1. NỘI DUNG THƯ / ĐƠN PHẢN ÁNH GỐC (Thay thế cho khung ảnh) */}
                <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
                  <div className="bg-slate-50/90 border-b border-slate-200/80 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gov-blue text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Mail className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                          Nội Dung Thư / Đơn Phản Ánh Gốc
                        </h3>
                        <span className="text-[11px] text-slate-500">
                          Kênh tiếp nhận: <strong className="text-gov-blue font-semibold">{formatSourceLabel(selectedTicket.source)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <div className="text-slate-500 text-[11px]">
                        Hộp thư đến: <strong className="text-slate-700 font-mono">{selectedTicket.source === 'EMAIL' ? 'tiepnhandonthu@dongnai.gov.vn' : 'Cổng DVC Trực Tuyến'}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Thời gian nhận: <span className="font-medium text-slate-600">{selectedTicket.created_at || 'Vừa tiếp nhận'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-3.5">
                    {/* Thông tin người gửi & Địa chỉ liên hệ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/70">
                      <div>
                        <span className="text-slate-500 block text-[11px] font-medium">Người gửi:</span>
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                          <User className="w-3.5 h-3.5 text-gov-blue shrink-0" />
                          {selectedTicket.citizen_name || 'Công dân chưa khai báo tên'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[11px] font-medium">Địa chỉ Email người gửi:</span>
                        <span className="font-bold text-gov-blue text-sm flex items-center gap-1.5 mt-0.5 font-mono">
                          <Mail className="w-3.5 h-3.5 text-gov-blue shrink-0" />
                          {selectedTicket.citizen_email || 'Chưa cung cấp'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[11px] font-medium">Số điện thoại liên hệ:</span>
                        <span className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {selectedTicket.citizen_phone || 'Chưa cung cấp'}
                        </span>
                      </div>
                    </div>

                    {/* Tiêu đề phản ánh */}
                    <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-lg space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gov-blue block">
                        Tiêu đề phản ánh / Trích yếu thư:
                      </span>
                      <p className="text-slate-900 text-sm font-semibold leading-relaxed">
                        {selectedTicket.ai_result?.summary || selectedTicket.raw_text?.split('\n')[0] || 'Phản ánh, kiến nghị của công dân'}
                      </p>
                    </div>

                    {/* Toàn văn nội dung phản ánh / thư gốc */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-gov-blue" />
                          Toàn văn nội dung chi tiết:
                        </label>
                        <span className="text-[11px] text-slate-400">Nguyên bản tiếp nhận</span>
                      </div>
                      <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 text-slate-900 text-sm leading-relaxed whitespace-pre-wrap font-normal selection:bg-blue-100 max-h-96 overflow-y-auto">
                        {selectedTicket.raw_text || 'Không có nội dung văn bản.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Bóc Tách Thực Thể, Phân Tuyến & Căn Cứ Pháp Lý RAG */}
                <AiAnalysisCard
                  ticket={selectedTicket}
                  editedExtractedText={editedExtractedText}
                  setEditedExtractedText={setEditedExtractedText}
                />

                {/* Ghi chú điều phối / Chuyển tuyến trước đó (nếu có) */}
                {selectedTicket.admin_note && (
                  <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                      Lịch sử điều phối / Chuyển tuyến:
                    </span>
                    <div className="text-slate-700 whitespace-pre-wrap font-mono text-[11px] pl-5">
                      {selectedTicket.admin_note}
                    </div>
                  </div>
                )}

                {/* 3. Soạn Thảo & Phê Duyệt Văn Bản Theo Nghị Định 30 */}
                <DraftResponseEditor
                  editedDraftReply={editedDraftReply}
                  setEditedDraftReply={setEditedDraftReply}
                  onApplyTemplate={applyOfficialGovTemplate}
                  onApprove={handleApprove}
                  isSubmittingApproval={isSubmittingApproval}
                  onTransfer={handleTransfer}
                  isTransferring={isTransferring}
                  onSaveDraft={handleSaveDraft}
                  selectedTicket={selectedTicket}
                />
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-slate-400 space-y-3 m-auto">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <div className="text-base font-bold text-slate-700">
                Chưa Chọn Hồ Sơ Nào
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Vui lòng chọn một hồ sơ trong danh sách bên trái để kiểm tra đối chiếu và phê duyệt phát hành văn bản.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===================== MODAL CHUYỂN TUYẾN THỦ CÔNG ===================== */}
      <ReassignModal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        selectedTicket={selectedTicket}
        reassignDept={reassignDept}
        setReassignDept={setReassignDept}
        reassignReason={reassignReason}
        setReassignReason={setReassignReason}
        onConfirmReassign={handleConfirmReassign}
        isTransferring={isTransferring}
        departments={departments}
      />

    </div>
  );
}
