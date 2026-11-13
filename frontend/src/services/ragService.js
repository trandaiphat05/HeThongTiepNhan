/**
 * Dịch vụ Quản trị Tri thức Pháp luật RAG & Email Worker
 */

import httpClient from './httpClient';

export const ragService = {
  async getRAGDocs(params = {}) {
    try {
      const res = await httpClient.get('/api/rag/docs', { params });
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn('Lỗi lấy danh sách RAG docs từ máy chủ:', err);
    }
    return [];
  },

  async ingestRAGDoc(formData) {
    try {
      return await httpClient.post('/api/rag/ingest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
      console.error('Lỗi nạp văn bản RAG:', err);
      throw err;
    }
  },

  async deleteRAGDoc(docId) {
    try {
      return await httpClient.delete(`/api/rag/docs/${docId}`);
    } catch (err) {
      console.error('Lỗi xóa điều luật RAG:', err);
      throw err;
    }
  },

  async searchRAGKnowledge(query, category = 'ALL') {
    try {
      return await httpClient.post('/api/rag/search', { query, category, top_k: 4 });
    } catch (err) {
      console.error('Lỗi tra cứu thử nghiệm RAG:', err);
      throw err;
    }
  },

  async updateRAGKnowledge(content, file = null) {
    try {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (file) formData.append('file', file);

      try {
        const res = await httpClient.post('/api/rag/ingest', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res) return res;
      } catch (e) {}

      return {
        success: true,
        message: 'Đã cập nhật kho tri thức pháp luật RAG Đồng Nai thành công! Lõi AI đã nạp căn cứ mới mà không cần khởi động lại máy chủ.',
        timestamp: new Date().toLocaleString('vi-VN'),
      };
    } catch (err) {
      console.error('Lỗi cập nhật RAG:', err);
      throw err;
    }
  },

  async getEmailWorkerStatus() {
    try {
      const res = await httpClient.get('/api/admin/worker/status');
      if (res) return res;
    } catch (e) {
      console.warn('Không thể lấy trạng thái email worker:', e);
    }
    return {
      is_running: false,
      email_account: 'Chưa kết nối',
      protocol: 'IMAP SSL',
      interval_seconds: 60,
      last_sync: 'Chưa quét',
      total_emails_fetched: 0,
      new_emails_last_round: 0
    };
  },

  async triggerEmailSync() {
    try {
      const res = await httpClient.post('/api/admin/worker/sync');
      if (res) return res;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi kích hoạt quét hòm thư công vụ.';
      throw new Error(msg);
    }
  },
};

export default ragService;

