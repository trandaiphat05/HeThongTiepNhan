import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { UserPlus, X } from 'lucide-react';
import { ALL_DEPARTMENTS } from '../../../constants/departments';

/**
 * Modal thêm mới Cán bộ / Người dùng
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Trạng thái hiển thị modal
 * @param {() => void} props.onClose - Đóng modal
 * @param {(userData: Object) => Promise<void>} props.onSubmit - Callback tạo mới tài khoản
 */
export default function UserModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    role: 'OFFICER',
    dept_code: 'SO_GTVT',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.username) {
      alert('Vui lòng nhập đầy đủ thông tin cán bộ.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ full_name: '', username: '', role: 'OFFICER', dept_code: 'SO_GTVT' });
      onClose();
    } catch (err) {
      alert('Lỗi tạo tài khoản: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header Modal */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-900 uppercase flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-gov-blue" />
            Thêm Cán Bộ / Người Dùng Mới
          </h4>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Họ và Tên cán bộ:
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Ví dụ: Nguyễn Văn Hoàng"
              className="gov-input text-xs sm:text-sm py-2"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tên đăng nhập (Username):
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="canbo_hoangnv"
              className="gov-input text-xs sm:text-sm font-mono py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Vai trò thẩm quyền:
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="gov-input text-xs font-medium py-2 text-slate-800"
              >
                <option value="OFFICER">Cán Bộ Chuyên Trách</option>
                <option value="ONE_STOP">Chuyên viên Tiếp công dân</option>
                <option value="ADMIN">Quản Trị Viên</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Đơn vị trực thuộc:
              </label>
              <select
                value={formData.dept_code}
                onChange={(e) => setFormData({ ...formData, dept_code: e.target.value })}
                className="gov-input text-xs font-medium py-2 text-slate-800"
              >
                {ALL_DEPARTMENTS.filter(d => d.code !== 'REQUIRE_HUMAN_REVIEW').map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="gov-btn-secondary text-xs py-2 px-3.5"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="gov-btn-primary text-xs py-2 px-4 font-semibold shadow-xs"
            >
              {submitting ? 'Đang Tạo...' : 'Tạo Tài Khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

UserModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

