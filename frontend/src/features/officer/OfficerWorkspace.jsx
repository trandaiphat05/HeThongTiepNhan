import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import GmailInboxList from './components/GmailInboxList';
import SplitReadingReplyPane from './components/SplitReadingReplyPane';
import ReassignModal from './components/ReassignModal';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { ALL_DEPARTMENTS } from '../../constants/departments';

/**
 * Bàn Làm Việc Cán Bộ Thụ Lý (OfficerWorkspace)
 * - Tích hợp Gmail List View tiêu chuẩn
 * - Split 45/55 Reading & Reply Pane
 * - Zero AI Hype
 */
export default function OfficerWorkspace() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || 'all';
  const currentQuery = searchParams.get('q') || '';

  const [selectedDept, setSelectedDept] = useState('ALL');
  const officerDept = user?.role === 'OFFICER'
    ? user.department_code || user.dept_code
    : null;

  // Tickets data
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Reassign Modal
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignDept, setReassignDept] = useState('SO_GTVT');
  const [reassignReason, setReassignReason] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Approval & draft state
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [toast, setToast] = useState(null);

  const departments = [
    { code: 'ALL', name: 'Tất Cả Các Đơn Vị' },
    ...ALL_DEPARTMENTS,
  ];

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchTickets = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.getTickets({
        dept_code: officerDept || (selectedDept !== 'ALL' ? selectedDept : undefined),
        search: currentQuery || undefined,
      });

      let filtered = Array.isArray(data) ? data : [];

      // Filter by tab
      if (currentTab === 'priority') {
        filtered = filtered.filter((t) => t.priority === 'CAO');
      } else if (currentTab === 'manual') {
        filtered = filtered.filter(
          (t) =>
            t.dept_code === 'REQUIRE_HUMAN_REVIEW' ||
            t.status === 'HUMAN_REVIEW' ||
            t.ai_result?.is_fallback ||
            t.ai_failed
        );
      } else if (currentTab === 'processing') {
        filtered = filtered.filter((t) => t.status === 'ROUTED' || t.status === 'PROCESSING');
      } else if (currentTab === 'approved') {
        filtered = filtered.filter((t) => t.status === 'APPROVED');
      }

      setTickets(filtered);

      // If viewing a ticket that's updated
      if (selectedTicket) {
        const found = filtered.find((t) => t.ticket_id === selectedTicket.ticket_id);
        if (found) setSelectedTicket(found);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách hồ sơ:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentTab, currentQuery, selectedDept, officerDept]);

  // Handle reassign
  const handleOpenReassignModal = () => {
    if (!selectedTicket) return;
    setReassignDept(selectedTicket.dept_code || 'SO_GTVT');
    setReassignReason('');
    setIsReassignModalOpen(true);
  };

  const handleConfirmReassign = async () => {
    if (!selectedTicket) return;
    if (!reassignReason.trim()) {
      showToast('warning', 'Vui lòng nhập lý do chuyển tuyến theo quy định kiểm toán.');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await api.reassignTicket(selectedTicket.ticket_id, {
        department_code: reassignDept,
        reason: reassignReason.trim(),
      });

      const updatedDept = res.department_code || reassignDept;
      const updatedDeptName = res.dept_name || reassignDept;

      setSelectedTicket((prev) => ({
        ...prev,
        dept_code: updatedDept,
        department_code: updatedDept,
        dept_name: updatedDeptName,
      }));

      showToast('success', `Đã chuyển cơ quan thụ lý hồ sơ ${selectedTicket.tracking_code} sang ${updatedDeptName}!`);
      setIsReassignModalOpen(false);
      fetchTickets(true);
    } catch (err) {
      showToast('warning', 'Lỗi khi chuyển cơ quan thụ lý: ' + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle Save Draft
  const handleSaveDraft = async (draftData) => {
    if (!selectedTicket) return;
    setIsSavingDraft(true);
    try {
      const payload = {
        summary: draftData.summary,
        draft_reply: draftData.draft_reply || draftData.draftReply,
        extracted_text: draftData.extracted_text || draftData.extractedText,
        department_code: draftData.department_code || draftData.assignedDept,
        legal_basis: draftData.legal_basis,
      };
      const res = await api.updateDraft(selectedTicket.ticket_id, payload);

      // Update selectedTicket with returned ticket or merged updates
      const returnedTicket = res?.ticket || (res?.ticket_id ? res : null);
      if (returnedTicket && returnedTicket.ticket_id) {
        setSelectedTicket(returnedTicket);
      } else {
        setSelectedTicket((prev) => ({
          ...prev,
          dept_code: payload.department_code || prev.dept_code,
          department_code: payload.department_code || prev.department_code,
          dept_name: departments.find((d) => d.code === payload.department_code)?.name || prev.dept_name,
          ai_result: {
            ...prev.ai_result,
            summary: payload.summary !== undefined ? payload.summary : prev.ai_result?.summary,
            draft_reply: payload.draft_reply !== undefined ? payload.draft_reply : prev.ai_result?.draft_reply,
            extracted_text: payload.extracted_text !== undefined ? payload.extracted_text : prev.ai_result?.extracted_text,
          },
        }));
      }

      showToast('success', `Đã lưu nháp các nội dung hiệu chỉnh cho hồ sơ ${selectedTicket?.tracking_code}.`);
      fetchTickets(true);
    } catch (err) {
      showToast('warning', 'Lỗi khi lưu bản nháp: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle Approve & Dispatch
  const handleApprove = async ({ draft_reply, extracted_text, department_code }) => {
    if (!selectedTicket) return;
    setIsSubmittingApproval(true);

    try {
      await api.approveTicket(selectedTicket.ticket_id, {
        draft_reply,
        extracted_text,
        department_code,
      });

      showToast('success', `Đã phê duyệt và ban hành văn bản chính thức cho hồ sơ ${selectedTicket.tracking_code}.`);
      await fetchTickets(true);
      // Return back to list view
      setSelectedTicket(null);
    } catch (err) {
      showToast('warning', 'Không thể phê duyệt hồ sơ: ' + err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main View: Split Pane (if ticket selected) OR Inbox View (if no ticket selected) */}
      {selectedTicket ? (
        <SplitReadingReplyPane
          ticket={selectedTicket}
          onBack={() => setSelectedTicket(null)}
          onApprove={handleApprove}
          onSaveDraft={handleSaveDraft}
          onOpenReassign={handleOpenReassignModal}
          isSubmittingApproval={isSubmittingApproval}
          isSavingDraft={isSavingDraft}
          departments={departments}
        />
      ) : (
        <GmailInboxList
          tickets={tickets}
          loading={loading}
          isRefreshing={isRefreshing}
          onRefresh={() => fetchTickets(true)}
          onSelectTicket={(ticket) => setSelectedTicket(ticket)}
          selectedTicket={selectedTicket}
          activeFilter={currentTab}
          onFilterChange={(tab) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('tab', tab);
            setSearchParams(newParams);
          }}
          selectedDept={selectedDept}
          onDeptChange={(dept) => setSelectedDept(dept)}
          departments={departments}
        />
      )}

      {/* ReassignModal */}
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
