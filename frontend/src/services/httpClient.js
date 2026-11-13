/**
 * Axios HTTP Client Instance dùng chung cho toàn bộ ứng dụng Frontend
 * Sử dụng baseURL là đường dẫn tương đối để chuyển tiếp tự động qua Vite Proxy (Zero IP Dependency)
 */

import axios from 'axios';

/**
 * Xác định baseURL cho API:
 * - Khi VITE_API_URL được cấu hình là chuỗi rỗng "" (hoặc tương đối), sử dụng đường dẫn tương đối qua Vite proxy
 * - Giúp hệ thống không còn phụ thuộc vào bất kỳ IP máy chủ tĩnh nào khi truy cập qua LAN / Mobile
 */
export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL !== undefined) {
    return import.meta.env.VITE_API_URL;
  }
  return '';
}

export const API_BASE_URL = getApiBaseUrl();

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});

// Request Interceptor: Chuẩn hóa đường dẫn nếu URL bắt đầu bằng '/api/' và đính kèm Token
httpClient.interceptors.request.use(
  (config) => {
    if (config.baseURL?.endsWith('/api') && config.url?.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }
    // Tự động đính kèm Bearer token từ localStorage nếu đã đăng nhập
    const token = localStorage.getItem('civic_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Trích xuất response.data và xử lý lỗi tập trung
httpClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorMsg = error.response?.data?.detail || error.message || 'Lỗi kết nối máy chủ API';
    console.warn(`[Axios API Error] [${error.config?.method?.toUpperCase()} ${error.config?.url}]:`, errorMsg);
    return Promise.reject(error);
  }
);

export default httpClient;
