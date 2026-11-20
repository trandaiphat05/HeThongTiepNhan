import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import ComplaintSubmitForm from './components/ComplaintSubmitForm';
import SubmissionReceipt from './components/SubmissionReceipt';
import ComplaintTrackingSection from './components/ComplaintTrackingSection';
import CitizenComplaintHistory from './components/CitizenComplaintHistory';

/**
 * Cổng Tiếp Nhận & Tra Cứu Đơn Thư Trực Tuyến - Dành Cho Người Dân
 * Điều hướng 100% đồng bộ qua Sidebar URL Query (?tab=submit | ?tab=lookup | ?tab=history)
 */
export default function CitizenPortal({ initialTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const rawTab = (searchParams.get('tab') || '').toLowerCase();
  const isTrackingRoute = location.pathname === '/tracking';

  let activeTab = 'submit';
  if (rawTab === 'lookup' || rawTab === 'track' || isTrackingRoute || initialTab === 'lookup') {
    activeTab = 'lookup';
  } else if (rawTab === 'history' || initialTab === 'history') {
    activeTab = 'history';
  } else {
    activeTab = 'submit';
  }

  const [submittedCode, setSubmittedCode] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const lookupRef = useRef(null);

  // Lắng nghe sự kiện click [+ Gửi đơn mới] từ Sidebar khi người dân muốn xóa trắng form để soạn đơn mới
  useEffect(() => {
    const handleReset = () => {
      setSubmittedCode(null);
      setSubmittedData(null);
      setFormResetKey((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('citizen-reset-submit-form', handleReset);
    return () => window.removeEventListener('citizen-reset-submit-form', handleReset);
  }, []);

  const handleSubmitSuccess = (trackingCode, ticketData) => {
    setSubmittedCode(trackingCode);
    setSubmittedData(ticketData || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTicketForTracking = (codeToLookup) => {
    const code = (typeof codeToLookup === 'string' && codeToLookup.trim()) ? codeToLookup.trim() : submittedCode;
    if (code) {
      setSubmittedCode(code);
      setSearchParams({ tab: 'lookup', code });
    } else {
      setSearchParams({ tab: 'lookup' });
    }
    if (lookupRef.current) {
      setTimeout(() => {
        lookupRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleGoToSubmit = () => {
    setSubmittedCode(null);
    setSearchParams({ tab: 'submit' });
    setFormResetKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const effectiveLookupCode = submittedCode || searchParams.get('code') || searchParams.get('q') || '';

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-5">
      
      {/* 1. Header Cổng Dịch Vụ Công */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 text-center space-y-3 shadow-xs">
        <div className="inline-flex items-center gap-1.5 bg-[#EAF1FB] text-[#0B57D0] text-xs font-semibold px-3.5 py-1 rounded-full uppercase tracking-wider">
          <Landmark className="w-3.5 h-3.5" />
          <span>CỔNG TIẾP NHẬN PHẢN ÁNH • TỈNH ĐỒNG NAI</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1F1F1F] tracking-tight">
          Tiếp Nhận & Điều Phối Đơn Thư Trực Tuyến
        </h2>
        <p className="text-[#5F6368] text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Gửi phản ánh, kiến nghị trực tuyến hoặc tra cứu tiến độ xử lý hồ sơ hành chính 24/7.
        </p>
      </div>

      {/* 2. MÀN HÌNH 1: BIÊN NHẬN ĐIỆN TỬ (KHI ĐÃ NỘP THÀNH CÔNG) HOẶC FORM GỬI PHẢN ÁNH */}
      {activeTab === 'submit' && submittedCode && (
        <SubmissionReceipt
          trackingCode={submittedCode}
          ticketData={submittedData}
          onLookupNow={handleSelectTicketForTracking}
          onNewSubmission={handleGoToSubmit}
        />
      )}

      {activeTab === 'submit' && !submittedCode && (
        <ComplaintSubmitForm
          key={formResetKey}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}

      {/* 3. MÀN HÌNH 2: KHUNG TRA CỨU TIẾN ĐỘ THEO MÃ HỒ SƠ */}
      {activeTab === 'lookup' && (
        <ComplaintTrackingSection
          ref={lookupRef}
          initialCode={effectiveLookupCode}
        />
      )}

      {/* 4. MÀN HÌNH 3: LỊCH SỬ ĐƠN THƯ ĐÃ GỬI */}
      {activeTab === 'history' && (
        <CitizenComplaintHistory
          onSelectTicket={handleSelectTicketForTracking}
          onGoToSubmit={handleGoToSubmit}
        />
      )}

    </div>
  );
}

CitizenPortal.propTypes = {
  initialTab: PropTypes.string,
};
