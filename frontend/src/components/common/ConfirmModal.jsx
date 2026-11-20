import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, HelpCircle } from 'lucide-react';
import CenterModal from './CenterModal';

/**
 * Reusable Confirm Dialog based on CenterModal
 * For critical actions: Approve & Dispatch, Delete Law, Reassign
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận thao tác',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isDanger = false,
  isLoading = false,
}) {
  return (
    <CenterModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title={
        <div className="flex items-center gap-2">
          {isDanger ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <HelpCircle className="w-5 h-5 text-[#0B57D0] shrink-0" />
          )}
          <span>{title}</span>
        </div>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#5F6368] hover:bg-slate-200/70 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-all shadow-xs flex items-center gap-1.5 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#0B57D0] hover:bg-[#0842A0]'
            } disabled:opacity-50`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </>
      }
    >
      <div className="text-sm text-[#5F6368] leading-relaxed py-1">
        {message}
      </div>
    </CenterModal>
  );
}

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.node.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isDanger: PropTypes.bool,
  isLoading: PropTypes.bool,
};
