import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { api } from '../../../services/api';
import UserTable from './accounts/UserTable';
import UserModal from './accounts/UserModal';
import EmailWorkerCard from './accounts/EmailWorkerCard';
import PendingOfficerApprovals from './accounts/PendingOfficerApprovals';

/**
 * Tab Quản lý Tài khoản Cán bộ & Trạng thái Email Worker
 * 
 * @param {Object} props
 * @param {(type: 'success' | 'warning', message: string) => void} props.onToast - Thông báo toast
 */
export default function AccountManagementTab({ onToast }) {
  const [users, setUsers] = useState([]);
  const [emailWorker, setEmailWorker] = useState(null);
  const [isSyncingEmail, setIsSyncingEmail] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const fetchAccountsAndWorker = async () => {
    try {
      const [u, , w] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
        api.getEmailWorkerStatus(),
      ]);
      setUsers(u || []);
      setEmailWorker(w || null);
    } catch (err) {
      console.error('Lỗi tải tài khoản/worker:', err);
    }
  };

  useEffect(() => {
    fetchAccountsAndWorker();
  }, []);

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await api.toggleUserStatus(userId);
      setUsers(users.map(u => u.user_id === userId ? { ...u, is_active: res.is_active } : u));
      if (onToast) {
        onToast('success', `Đã cập nhật trạng thái tài khoản: ${res.is_active ? 'Đang hoạt động' : 'Đã tạm khóa'}.`);
      }
    } catch (err) {
      alert('Lỗi cập nhật tài khoản: ' + err.message);
    }
  };

  const handleApproveOfficer = async (officer) => {
    try {
      await api.approveOfficer(officer.user_id);
      await fetchAccountsAndWorker();
      if (onToast) {
        onToast('success', `Đã phê duyệt tài khoản cán bộ "${officer.full_name}" (${officer.username}) thành công. Cán bộ đã có thể đăng nhập.`);
      }
    } catch (err) {
      alert('Lỗi khi phê duyệt cán bộ: ' + err.message);
    }
  };

  const handleRejectOfficer = async (officer) => {
    try {
      await api.rejectOfficer(officer.user_id);
      await fetchAccountsAndWorker();
      if (onToast) {
        onToast('warning', `Đã từ chối và hủy bỏ yêu cầu đăng ký của cán bộ "${officer.full_name}".`);
      }
    } catch (err) {
      alert('Lỗi khi từ chối yêu cầu: ' + err.message);
    }
  };

  const handleCreateUser = async (newUserData) => {
    await api.createUser(newUserData);
    await fetchAccountsAndWorker();
    if (onToast) {
      onToast('success', 'Đã tạo mới tài khoản cán bộ thành công và phân quyền theo Sở/Ngành.');
    }
  };

  const handleSyncEmailNow = async () => {
    setIsSyncingEmail(true);
    try {
      const res = await api.triggerEmailSync();
      setEmailWorker(res.status);
      if (onToast) onToast('success', res.message);
    } catch (err) {
      alert('Lỗi quét email: ' + err.message);
    } finally {
      setIsSyncingEmail(false);
    }
  };

  // Tách danh sách: Cán bộ chờ duyệt vs Cán bộ đang hoạt động
  const pendingOfficers = users.filter(u => u.role === 'OFFICER' && !u.is_active);
  const activeUsers = users.filter(u => u.is_active || u.role !== 'OFFICER');

  return (
    <div className="space-y-6">
      {/* 1. KHU VỰC DUYỆT TÀI KHOẢN CÁN BỘ CHỜ DUYỆT CỦA ADMIN */}
      <PendingOfficerApprovals
        pendingOfficers={pendingOfficers}
        onApprove={handleApproveOfficer}
        onReject={handleRejectOfficer}
      />

      {/* 2. DANH SÁCH CÁN BỘ ĐANG HOẠT ĐỘNG & PHÂN QUYỀN */}
      <div className="gov-card p-5 sm:p-6 space-y-4">
        <UserTable
          users={activeUsers}
          onOpenAddUser={() => setShowAddUserModal(true)}
          onToggleStatus={handleToggleUserStatus}
        />
      </div>

      {/* 3. QUẢN TRỊ TRẠNG THÁI EMAIL WORKER */}
      <EmailWorkerCard
        worker={emailWorker}
        isSyncing={isSyncingEmail}
        onSyncNow={handleSyncEmailNow}
      />

      <UserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  );
}

AccountManagementTab.propTypes = {
  onToast: PropTypes.func,
};

