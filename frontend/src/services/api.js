/**
 * Cổng API thống nhất cho toàn bộ hệ thống Tiếp nhận & Điều phối Đơn thư Đồng Nai
 * Tái cấu trúc theo tiêu chuẩn Clean Architecture:
 * - Module hóa thành các service con: ticketService, authService, ragService
 * - Sử dụng chung httpClient (Axios Instance có baseURL động và Token Interceptor)
 * - Đảm bảo 100% tương thích ngược cho tất cả component đang import { api, getImageUrl, compressImage }
 */

import httpClient, { API_BASE_URL as httpClientBaseUrl } from './httpClient';
import { ticketService, getBackendBaseUrl, getImageUrl, compressImage, BACKEND_SERVER_URL } from './ticketService';
import { authService } from './authService';
import { ragService } from './ragService';

// Cấu hình baseURL là đường dẫn tương đối qua Vite proxy (chuỗi rỗng, không phụ thuộc IP cứng)
export const baseURL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';
export const API_BASE_URL = baseURL || httpClientBaseUrl;

export const apiClient = httpClient;
export { getBackendBaseUrl, getImageUrl, compressImage, BACKEND_SERVER_URL };
export { ticketService } from './ticketService';
export { authService } from './authService';
export { ragService } from './ragService';

export const api = {
  ...ticketService,
  ...authService,
  ...ragService,
  getImageUrl,
  compressImage,
};

export default api;
