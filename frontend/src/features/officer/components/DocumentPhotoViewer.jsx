import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, 
  Maximize2 
} from 'lucide-react';
import { getImageUrl } from '../../../services/ticketService';
import { formatSourceLabel } from '../../../utils/formatters';

/**
 * Left (45%) Document & Photo Viewer
 * Features:
 * - Page 1/2 switcher
 * - Rotate (90 deg increments)
 * - Zoom in / Zoom out / Reset
 * - Supports real image attachments or formatted official paper view
 */
export default function DocumentPhotoViewer({ ticket }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!ticket) return null;

  // Collect all image URLs
  const images = [];
  if (ticket.image_url) images.push(getImageUrl(ticket.image_url));
  if (Array.isArray(ticket.image_urls)) {
    ticket.image_urls.forEach((u) => {
      if (u && !images.includes(getImageUrl(u))) {
        images.push(getImageUrl(u));
      }
    });
  }

  // If there are multiple images, total pages is images.length; else at least 2 pages (simulated scan / original text)
  const totalPages = Math.max(images.length, 2);
  const activeImageUrl = images[currentPage - 1] || images[0] || null;

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  return (
    <div className="bg-slate-100 border border-[#E2E8F0] rounded-2xl flex flex-col h-full min-h-[580px] overflow-hidden shadow-xs">
      {/* Top Toolbar */}
      <div className="p-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between gap-2 shrink-0">
        {/* Page Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-full text-xs font-semibold text-[#1F1F1F]">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded-full hover:bg-white disabled:opacity-30 transition-colors"
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-xs px-1">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-full hover:bg-white disabled:opacity-30 transition-colors"
            title="Trang sau"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom & Rotate Tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#5F6368] hover:text-[#1F1F1F] transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-[#5F6368] min-w-[36px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#5F6368] hover:text-[#1F1F1F] transition-colors"
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#5F6368] hover:text-[#1F1F1F] transition-colors"
            title="Xoay 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#5F6368] hover:text-[#1F1F1F] transition-colors"
            title="Mặc định"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewer Canvas Area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative bg-slate-200/60 select-none">
        {activeImageUrl ? (
          <div
            className="transition-transform duration-200 ease-out origin-center shadow-lg rounded-lg overflow-hidden bg-white"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={activeImageUrl}
              alt={`Tài liệu đính kèm - Trang ${currentPage}`}
              className="max-h-[500px] w-auto object-contain block"
            />
          </div>
        ) : (
          /* Render Official Document Paper when no photo file is attached */
          <div
            className="bg-white border border-[#E2E8F0] shadow-md rounded-xl p-6 w-full max-w-sm transition-transform duration-200 ease-out font-sans text-xs space-y-3 leading-relaxed"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            }}
          >
            <div className="text-center border-b border-slate-100 pb-2">
              <div className="text-[10px] font-bold uppercase text-[#5F6368]">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="text-[9px] text-[#5F6368]">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="text-xs font-bold text-[#1F1F1F] uppercase mt-2">
                ĐƠN PHẢN ÁNH, KIẾN NGHỊ
              </div>
              <div className="text-[10px] font-mono text-[#0B57D0]">
                Số: {ticket.tracking_code}
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-[#1F1F1F]">
              <div>
                <strong>Người làm đơn: </strong>
                {ticket.citizen_name || 'Công dân'}
              </div>
              <div>
                <strong>Số điện thoại: </strong>
                {ticket.citizen_phone || 'Không ghi'}
              </div>
              <div>
                <strong>Thời gian nộp: </strong>
                {ticket.created_at || 'Mới tiếp nhận'}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <strong>Nội dung phản ánh:</strong>
                <p className="mt-1 text-[#5F6368] whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {ticket.raw_text || ticket.ai_result?.extracted_text || 'Không có nội dung chi tiết'}
                </p>
              </div>
            </div>

            <div className="text-right text-[10px] text-[#5F6368] pt-2">
              Trang {currentPage} / {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* Viewer Footer info */}
      <div className="p-2.5 bg-white border-t border-[#E2E8F0] text-[11px] text-[#5F6368] flex items-center justify-between px-4">
        <span>Nguồn: <strong>{formatSourceLabel(ticket.source)}</strong></span>
        <span>Mã hồ sơ: <strong className="font-mono text-[#0B57D0]">{ticket.tracking_code}</strong></span>
      </div>
    </div>
  );
}

DocumentPhotoViewer.propTypes = {
  ticket: PropTypes.object,
};
