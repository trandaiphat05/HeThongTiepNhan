import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

/**
 * Reusable CenterModal Component
 * Conforms to Human Perspective - Zero AI Hype & Modern Administrative Design
 * - Centered window (max-w-md, max-w-lg, max-w-xl, etc.)
 * - Backdrop: bg-slate-900/45 backdrop-blur-sm
 * - ESC key handling, backdrop click handling
 * - Body scroll lock on mount/open
 * - Smooth fade-in + subtle zoom
 */
export default function CenterModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg',
  className = '',
  showCloseButton = true,
}) {
  // Body scroll lock and ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden transform transition-all duration-200 scale-100 animate-in fade-in zoom-in-95 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 border-b border-[#E2E8F0] bg-white">
            <div className="space-y-0.5 pr-4">
              {title && (
                <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F] tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-[#5F6368] hover:text-[#1F1F1F] hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer shrink-0"
                title="Đóng (ESC)"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 max-h-[calc(85vh-120px)] overflow-y-auto text-[#1F1F1F]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 px-5 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

CenterModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
  maxWidth: PropTypes.string,
  className: PropTypes.string,
  showCloseButton: PropTypes.bool,
};
