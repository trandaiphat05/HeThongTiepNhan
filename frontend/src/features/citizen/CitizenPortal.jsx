import React, { useState, useRef } from 'react';
import { Landmark, Send, Search, History } from 'lucide-react';
import ComplaintSubmitForm from './components/ComplaintSubmitForm';
import SubmissionReceipt from './components/SubmissionReceipt';
import SubmissionModal from './components/SubmissionModal';
import ComplaintTrackingSection from './components/ComplaintTrackingSection';
import CitizenComplaintHistory from './components/CitizenComplaintHistory';

/**
 * Cổng Tiếp Nhận & Tra Cứu Đơn Thư Trực Tuyến - Dành Cho Người Dân
 * Tích hợp:
 * 1. Form gửi phản ánh trực tuyến
 * 2. Khung tra cứu tiến độ theo mã hồ sơ (Timeline 4 bước)
 * 3. Lịch sử đơn thư đã gửi gắn với tài khoản công dân
 */
export default function CitizenPortal() {
  const [activeTab, setActiveTab] = useState('SUBMIT'); // 'SUBMIT' | 'TRACK' | 'HISTORY'
  const [submittedCode, setSubmittedCode] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const lookupRef = useRef(null);

  const handleSubmitSuccess = (trackingCode, ticketData) => {
    setSubmittedCode(trackingCode);
    setSubmittedData(ticketData || null);
    setIsModalOpen(true);
  };

  const handleSelectTicketForTracking = (codeToLookup) => {
    if (codeToLookup && typeof codeToLookup === 'string') {
      setSubmittedCode(codeToLookup);
    }
    setActiveTab('TRACK');
    if (lookupRef.current) {
      setTimeout(() => {
        lookupRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* 1. Tiêu Đề Cổng Dịch Vụ Công */}
      <div className="gov-card p-6 sm:p-7 text-center space-y-2.5">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-gov-blue text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-200">
          <Landmark className="w-3.5 h-3.5" />
          <span>Hệ Thống Dịch Vụ Công Trực Tuyến • Tỉnh Đồng Nai</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Cổng Tiếp Nhận Ý Kiến, Kiến Nghị & Phản Ánh
        </h2>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
          Tiếp nhận, xử lý và phản hồi phản ánh, kiến nghị của người dân và doanh nghiệp 24/7 qua biểu mẫu trực tuyến và hòm thư điện tử tiếp nhận của tỉnh.
        </p>

        {/* THANH ĐIỀU HƯỚNG PHÂN HỆ CÔNG DÂN (TABS) */}
        <div className="pt-3 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('SUBMIT')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'SUBMIT'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Gửi Phản Ánh</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TRACK')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'TRACK'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Tra Cứu Tiến Độ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Lịch Sử Đã Gửi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Xác Nhận Nộp Hồ Sơ Chuẩn Hành Chính */}
      <SubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticketData={submittedData}
        onLookupNow={handleSelectTicketForTracking}
      />

      {/* 2. Biên Nhận Tiếp Nhận Điện Tử (Hiển thị khi nộp thành công) */}
      {submittedCode && activeTab === 'SUBMIT' && (
        <SubmissionReceipt
          trackingCode={submittedCode}
          ticketData={submittedData}
          onLookupNow={handleSelectTicketForTracking}
        />
      )}

      {/* 3. TAB 1: FORM GỬI PHẢN ÁNH TRỰC TUYẾN */}
      {activeTab === 'SUBMIT' && (
        <ComplaintSubmitForm
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}

      {/* 4. TAB 2: KHUNG TRA CỨU TIẾN ĐỘ THEO MÃ HỒ SƠ (TIMELINE 4 BƯỚC) */}
      {activeTab === 'TRACK' && (
        <ComplaintTrackingSection
          ref={lookupRef}
          initialCode={submittedCode || ''}
        />
      )}

      {/* 5. TAB 3: LỊCH SỬ ĐƠN THƯ ĐÃ GỬI GẮN VỚI TÀI KHOẢN CÔNG DÂN */}
      {activeTab === 'HISTORY' && (
        <CitizenComplaintHistory
          onSelectTicket={handleSelectTicketForTracking}
          onGoToSubmit={() => setActiveTab('SUBMIT')}
        />
      )}

    </div>
  );
}
