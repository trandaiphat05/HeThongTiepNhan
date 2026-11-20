import React from 'react';
import PropTypes from 'prop-types';
import { Mail, RefreshCw } from 'lucide-react';

/**
 * Thẻ giám sát tiến trình quét email công vụ tự động (Gmail IMAP Worker)
 * 
 * @param {Object} props
 * @param {Object} props.worker - Dữ liệu trạng thái worker
 * @param {boolean} props.isSyncing - Trạng thái đang quét email
 * @param {() => void} props.onSyncNow - Callback kích hoạt quét email
 */
export default function EmailWorkerCard({ worker, isSyncing, onSyncNow }) {
  if (!worker) return null;

  return (
    <div className="gov-card p-5 sm:p-6 space-y-3.5 border-l-4 border-l-amber-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase">
              Tiến Trình Kết Nối Hòm Thư Công Vụ (IMAP Service)
            </h4>
            <p className="text-xs text-slate-500">
              Tự động thu thập ý kiến, phản ánh từ hòm thư công vụ và nạp vào luồng xử lý của hệ thống.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSyncNow}
          disabled={isSyncing}
          className="gov-btn-primary text-xs py-1.5 px-3.5 font-semibold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Đang Quét...' : 'Quét Thư Ngay'}</span>
        </button>
      </div>

      {/* Thông số giám sát */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
          <span className="text-[11px] font-semibold uppercase text-slate-500 block">Địa chỉ hòm thư:</span>
          <div className="font-mono font-semibold text-gov-blue text-xs truncate mt-0.5">
            {worker.email_account}
          </div>
        </div>

        <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
          <span className="text-[11px] font-semibold uppercase text-slate-500 block">Giao thức & Chu kỳ:</span>
          <div className="font-medium text-slate-800 text-xs mt-0.5">
            IMAP SSL • {worker.interval_seconds}s / lần
          </div>
        </div>

        <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
          <span className="text-[11px] font-semibold uppercase text-slate-500 block">Lần quét gần nhất:</span>
          <div className="font-medium text-slate-800 text-xs mt-0.5">
            {worker.last_sync}
          </div>
        </div>

        <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
          <span className="text-[11px] font-semibold uppercase text-slate-500 block">Tổng email đã nạp:</span>
          <div className="font-semibold text-emerald-700 text-xs mt-0.5">
            {worker.total_emails_fetched} thư thành công
          </div>
        </div>
      </div>
    </div>
  );
}

EmailWorkerCard.propTypes = {
  worker: PropTypes.object,
  isSyncing: PropTypes.bool,
  onSyncNow: PropTypes.func,
};

