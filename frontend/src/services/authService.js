/**
 * Dịch vụ Xác thực & Quản trị Tài khoản (Auth Service)
 */

import httpClient from './httpClient';
import { ALL_DEPARTMENTS, getDepartmentName } from '../constants/departments';

const localUsers = [
  { user_id: 1, full_name: 'Minh Nguyễn (Admin)', username: 'admin', role: 'ADMIN', dept_code: 'ALL', dept_name: 'Toàn Hệ Thống', is_active: true },
  { user_id: 2, full_name: 'Lê Thanh Bình (Sở GTVT)', username: 'canbo_gtvt', role: 'OFFICER', dept_code: 'SO_GTVT', dept_name: 'Sở Giao thông Vận tải', is_active: true },
  { user_id: 3, full_name: 'Hoàng Thị Yến (Sở TN&MT)', username: 'canbo_tnmt', role: 'OFFICER', dept_code: 'SO_TNMT', dept_name: 'Sở Tài nguyên & Môi trường', is_active: true },
  { user_id: 4, full_name: 'Đặng Quốc Huy (Sở Xây dựng)', username: 'canbo_xaydung', role: 'OFFICER', dept_code: 'SO_XD', dept_name: 'Sở Xây dựng', is_active: true },
  { user_id: 5, full_name: 'Đặng Quốc Huy (Sở XD)', username: 'canbo_soxd', role: 'OFFICER', dept_code: 'SO_XD', dept_name: 'Sở Xây dựng', is_active: true },
  { user_id: 6, full_name: 'Trần Thị Thu (Sở Y tế)', username: 'canbo_yte', role: 'OFFICER', dept_code: 'SO_YTE', dept_name: 'Sở Y tế', is_active: true },
  { user_id: 7, full_name: 'Phạm Đức Thắng (Sở GD&ĐT)', username: 'canbo_gddt', role: 'OFFICER', dept_code: 'SO_GDDT', dept_name: 'Sở Giáo dục & Đào tạo', is_active: true },
  { user_id: 8, full_name: 'Võ Thanh Sơn (Sở LĐ-TB&XH)', username: 'canbo_ldtbxh', role: 'OFFICER', dept_code: 'SO_LDTBXH', dept_name: 'Sở Lao động - Thương binh & Xã hội', is_active: true },
  { user_id: 9, full_name: 'Trần Văn An (Công an Tỉnh)', username: 'canbo_congan', role: 'OFFICER', dept_code: 'CONG_AN_TINH', dept_name: 'Công an Tỉnh Đồng Nai', is_active: true },
  { user_id: 10, full_name: 'Vũ Thị Ngọc - Chuyên viên Tiếp công dân', username: 'canbo_motcua', role: 'OFFICER', dept_code: 'UBND_CAP_HUYEN', dept_name: 'Ban Tiếp công dân Tỉnh', is_active: true },
  { user_id: 11, full_name: 'Nguyễn Văn Công Dân', username: 'congdan1', role: 'CITIZEN', dept_code: null, dept_name: 'Công dân', is_active: true }
];

const localDepartments = ALL_DEPARTMENTS;

export const authService = {
  /**
   * Đăng nhập: POST /api/auth/login
   */
  async login(credentials) {
    try {
      const res = await httpClient.post('/api/auth/login', credentials);
      if (res && res.access_token) return res;
      throw new Error('Đăng nhập không thành công: Không nhận được mã xác thực.');
    } catch (networkErr) {
      const msg = networkErr.response?.data?.detail || networkErr.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
      throw new Error(msg);
    }
  },

  /**
   * Đăng ký tài khoản người dùng: POST /api/auth/register
   */
  async register(userData) {
    try {
      const res = await httpClient.post('/api/auth/register', userData);
      return res;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Đăng ký tài khoản thất bại.';
      throw new Error(msg);
    }
  },

  /**
   * Xác minh & liên kết tài khoản Gmail thật: POST /api/auth/link-gmail
   */
  async linkGmail(gmail_account, gmail_app_password) {
    try {
      const res = await httpClient.post('/api/auth/link-gmail', {
        gmail_account,
        gmail_app_password
      });
      return res;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Không thể liên kết tài khoản Gmail.';
      throw new Error(msg);
    }
  },

  /**
   * Hủy liên kết tài khoản Gmail: POST /api/auth/unlink-gmail
   */
  async unlinkGmail() {
    try {
      const res = await httpClient.post('/api/auth/unlink-gmail');
      return res;
    } catch (err) {
      // Fallback
      return { success: true, message: 'Đã ngắt kết nối hòm thư Gmail.' };
    }
  },

  /**
   * Lấy trạng thái liên kết Gmail của user hiện tại: GET /api/auth/gmail-status
   */
  async getGmailStatus() {
    try {
      return await httpClient.get('/api/auth/gmail-status');
    } catch (err) {
      return { is_linked: false, gmail_account: null, last_synced_at: null };
    }
  },

  /**
   * Kích hoạt đồng bộ hộp thư Gmail thật (ZERO MOCK): POST /api/auth/sync-gmail
   */
  async syncGmail(params = {}) {
    try {
      const res = await httpClient.post('/api/auth/sync-gmail', params);
      return res;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Đồng bộ Gmail thất bại.';
      throw new Error(msg);
    }
  },

  /**
   * Lấy thông tin user hiện tại: GET /api/auth/me
   */
  async getMe() {
    try {
      return await httpClient.get('/api/auth/me');
    } catch (e) {
      return null;
    }
  },

  /**
   * Quản lý danh sách cán bộ
   */
  async getUsers() {
    try {
      const res = await httpClient.get('/api/admin/users');
      if (Array.isArray(res)) return res;
    } catch (e) {}
    return [...localUsers];
  },

  async getDepartments(forOfficer = false) {
    try {
      const url = forOfficer ? '/api/departments?for_officer=true' : '/api/departments';
      const res = await httpClient.get(url);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (e) {}
    return forOfficer
      ? localDepartments.filter((d) => d.is_selectable_for_officer)
      : [...localDepartments];
  },

  async toggleUserStatus(userId) {
    try {
      const res = await httpClient.put(`/api/admin/users/${userId}/toggle`);
      if (res && res.success) {
        return { success: true, is_active: res.is_active };
      }
    } catch (e) {}

    const user = localUsers.find(u => u.user_id === userId);
    if (user) {
      user.is_active = !user.is_active;
      return { success: true, user };
    }
    throw new Error('Người dùng không tồn tại');
  },

  async createUser(userData) {
    try {
      const res = await httpClient.post('/api/admin/users', userData);
      if (res && res.user) return res;
    } catch (e) {}

    const newUser = {
      user_id: Date.now(),
      full_name: userData.full_name,
      username: userData.username,
      role: userData.role || 'OFFICER',
      dept_code: userData.dept_code,
      dept_name: localDepartments.find(d => d.code === userData.dept_code)?.name || userData.dept_code,
      is_active: true,
    };
    localUsers.unshift(newUser);
    return { success: true, user: newUser };
  },

  /**
   * Phê duyệt tài khoản cán bộ: PUT /api/admin/users/{userId}/approve
   */
  async approveOfficer(userId) {
    try {
      const res = await httpClient.put(`/api/admin/users/${userId}/approve`);
      return res;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi phê duyệt tài khoản cán bộ.';
      throw new Error(msg);
    }
  },

  /**
   * Từ chối tài khoản cán bộ: PUT /api/admin/users/{userId}/reject
   */
  async rejectOfficer(userId) {
    try {
      const res = await httpClient.put(`/api/admin/users/${userId}/reject`);
      return res;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi từ chối tài khoản cán bộ.';
      throw new Error(msg);
    }
  },
};

export default authService;

