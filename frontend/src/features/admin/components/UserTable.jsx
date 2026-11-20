import React from 'react';
import PropTypes from 'prop-types';
import { Users, UserPlus } from 'lucide-react';

/**
 * Bảng danh sách cán bộ và phân quyền
 * 
 * @param {Object} props
 * @param {Array} props.users - Danh sách người dùng
 * @param {() => void} props.onOpenAddUser - Mở modal thêm người dùng
 * @param {(userId: number) => void} props.onToggleStatus - Bật/tắt trạng thái người dùng
 */
export default function UserTable({ users = [], onOpenAddUser, onToggleStatus }) {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase flex items-center gap-2">
            <Users className="w-5 h-5 text-gov-blue" />
            Danh Sách Cán Bộ & Phân Quyền Theo Sở/Ban/Ngành
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý định danh tài khoản Chuyên viên Tiếp công dân và cán bộ chuyên trách giải quyết đơn thư.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddUser}
          className="gov-btn-primary text-xs py-2 px-3.5 font-semibold flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Cán Bộ Mới</span>
        </button>
      </div>

      {/* Bảng Cán bộ */}
      <div className="overflow-x-auto rounded-lg border border-slate-200/80">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200/80">
              <th className="py-2.5 px-3.5">Họ và Tên</th>
              <th className="py-2.5 px-3.5">Tài Khoản</th>
              <th className="py-2.5 px-3.5">Vai Trò Thẩm Quyền</th>
              <th className="py-2.5 px-3.5">Đơn Vị Trực Thuộc</th>
              <th className="py-2.5 px-3.5 text-center">Trạng Thái</th>
              <th className="py-2.5 px-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((u) => (
              <tr key={u.user_id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                  {u.full_name}
                </td>
                <td className="py-2.5 px-3.5 font-mono text-gov-blue text-xs font-semibold">
                  {u.username}
                </td>
                <td className="py-2.5 px-3.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    u.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-900 border border-purple-200'
                      : u.role === 'ONE_STOP'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-blue-100 text-gov-blue border border-blue-200'
                  }`}>
                    {u.role === 'ADMIN' && 'Quản Trị Viên'}
                    {u.role === 'OFFICER' && 'Cán Bộ Chuyên Trách'}
                    {u.role === 'ONE_STOP' && 'Chuyên viên Tiếp công dân'}
                  </span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-700 text-xs font-medium">
                  {u.dept_name}
                </td>
                <td className="py-2.5 px-3.5 text-center">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    u.is_active 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {u.is_active ? 'Hoạt Động' : 'Tạm Khóa'}
                  </span>
                </td>
                <td className="py-2.5 px-3.5 text-right">
                  {u.role === 'ADMIN' ? (
                    <span className="text-[11px] text-slate-400 italic">Quản trị tối cao</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleStatus(u.user_id)}
                      className={`text-[11px] px-2.5 py-1 rounded font-semibold transition-colors ${
                        u.is_active
                          ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                          : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {u.is_active ? 'Tạm Khóa' : 'Kích Hoạt'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

UserTable.propTypes = {
  users: PropTypes.array,
  onOpenAddUser: PropTypes.func,
  onToggleStatus: PropTypes.func,
};

