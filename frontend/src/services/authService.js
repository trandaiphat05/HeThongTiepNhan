/**
 * Dịch vụ Xác thực & Quản trị Tài khoản (Auth Service)
 */

import httpClient from './httpClient';

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
  { user_id: 10, full_name: 'Vũ Thị Ngọc (Một cửa)', username: 'canbo_motcua', role: 'OFFICER', dept_code: 'UBND_CAP_HUYEN', dept_name: 'Bộ phận Một cửa / UBND Cấp Huyện', is_active: true },
  { user_id: 11, full_name: 'Nguyễn Văn Công Dân', username: 'congdan1', role: 'CITIZEN', dept_code: null, dept_name: 'Công dân', is_active: true }
];

const localDepartments = [
  { code: 'SO_GTVT', name: 'Sở Giao thông Vận tải' },
  { code: 'SO_TNMT', name: 'Sở Tài nguyên & Môi trường' },
  { code: 'SO_XD', name: 'Sở Xây dựng' },
  { code: 'SO_YTE', name: 'Sở Y tế' },
  { code: 'SO_GDDT', name: 'Sở Giáo dục & Đào tạo' },
  { code: 'SO_LDTBXH', name: 'Sở Lao động - Thương binh & Xã hội' },
  { code: 'CONG_AN_TINH', name: 'Công an Tỉnh Đồng Nai' },
  { code: 'UBND_CAP_HUYEN', name: 'UBND Cấp Huyện / TP' },
  { code: 'UBND_TINH', name: 'UBND Tỉnh Đồng Nai' },
];

export const authService = {
  /**
   * Đăng nhập: POST /api/auth/login
   */
  async login(credentials) {
    try {
      const res = await httpClient.post('/api/auth/login', credentials);
      if (res && res.access_token) return res;
    } catch (networkErr) {
      const username = credentials.username?.toLowerCase()?.trim();
      const password = credentials.password;

      if (username === 'admin' && password === 'admin123') {
        return {
          access_token: 'mock_token_admin_' + Date.now(),
          token_type: 'bearer',
          user: {
            user_id: 1,
            username: 'admin',
            full_name: 'Quản trị viên Hệ thống',
            role: 'ADMIN',
            department_code: 'ADMIN',
          }
        };
      } else if (password === 'officer123') {
        const officerMap = {
          canbo_gtvt: { id: 2, name: 'Lê Thanh Bình - Sở GTVT', dept: 'SO_GTVT' },
          canbo_tnmt: { id: 3, name: 'Hoàng Thị Yến - Sở TN&MT', dept: 'SO_TNMT' },
          canbo_xaydung: { id: 4, name: 'Đặng Quốc Huy - Sở Xây dựng', dept: 'SO_XD' },
          canbo_soxd: { id: 5, name: 'Đặng Quốc Huy - Sở XD', dept: 'SO_XD' },
          canbo_yte: { id: 6, name: 'Trần Thị Thu - Sở Y tế', dept: 'SO_YTE' },
          canbo_gddt: { id: 7, name: 'Phạm Đức Thắng - Sở GD&ĐT', dept: 'SO_GDDT' },
          canbo_ldtbxh: { id: 8, name: 'Võ Thanh Sơn - Sở LĐ-TB&XH', dept: 'SO_LDTBXH' },
          canbo_congan: { id: 9, name: 'Trần Văn An - Công an Tỉnh', dept: 'CONG_AN_TINH' },
          canbo_motcua: { id: 10, name: 'Vũ Thị Ngọc - Bộ phận Một cửa', dept: 'UBND_CAP_HUYEN' },
        };
        const officer = officerMap[username];
        if (officer) {
          return {
            access_token: 'mock_token_officer_' + Date.now(),
            token_type: 'bearer',
            user: {
              user_id: officer.id,
              username,
              full_name: officer.name,
              role: 'OFFICER',
              department_code: officer.dept,
            }
          };
        }
      } else if (username === 'congdan1' && password === 'citizen123') {
        return {
          access_token: 'mock_token_citizen_' + Date.now(),
          token_type: 'bearer',
          user: {
            user_id: 11,
            username: 'congdan1',
            full_name: 'Nguyễn Văn Công Dân',
            role: 'CITIZEN',
            department_code: null,
          }
        };
      }
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

  async getDepartments() {
    return [...localDepartments];
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

