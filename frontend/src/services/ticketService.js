/**
 * Dịch vụ Quản lý Đơn thư (Ticket Service)
 * Tích hợp kết nối API FastAPI cho Cổng Dịch vụ công & Bàn làm việc Cán bộ
 */

import httpClient from './httpClient';

export function getBackendBaseUrl() {
  if (import.meta.env.VITE_API_URL !== undefined) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  return '';
}

export const BACKEND_SERVER_URL = getBackendBaseUrl();

/**
 * Chuẩn hóa URL ảnh đính kèm:
 * - Hỗ trợ cả link tuyệt đối http/https và đường dẫn tương đối /uploads/...
 * - Tự động thay thế localhost/127.0.0.1 bằng đường dẫn tương đối để chuyển tiếp qua Vite proxy
 */
export function getImageUrl(url) {
  if (!url) return '';
  if (
    url.startsWith('http://') || 
    url.startsWith('https://') || 
    url.startsWith('data:') || 
    url.startsWith('blob:')
  ) {
    if (url.includes('localhost:8000') || url.includes('127.0.0.1:8000')) {
      return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, getBackendBaseUrl());
    }
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const base = getBackendBaseUrl();
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * Nén hình ảnh trên trình duyệt xuống dưới dung lượng trần
 */
export async function compressImage(file, maxSizeMB = 1.5) {
  if (!file || !file.type.startsWith('image/')) return file;
  if (file.size <= maxSizeMB * 1024 * 1024) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1920;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
    };
    reader.onerror = () => resolve(file);
  });
}

// CSDL mô phỏng dự phòng khi backend offline
let localTickets = [
  {
    ticket_id: 1,
    tracking_code: 'ĐN-20261112-001',
    ticket_code: 'ĐN-20261112-001',
    source: 'WEB_TEXT',
    citizen_name: 'Nguyễn Văn Hùng',
    citizen_phone: '0912345678',
    citizen_email: 'hung.nv@gmail.com',
    raw_text: 'Đoạn đg Nguyễn Ái Quốc gần ngã tư Tân Phong bh bị sụt lún ổ gà nhiều quá trời, xe cộ đi lại dễ té ngã liên tục. Đề nghị sửa gấp giùm dân.',
    image_url: null,
    status: 'ROUTED',
    dept_code: 'SO_GTVT',
    dept_name: 'Sở Giao thông Vận tải',
    priority: 'CAO',
    created_at: '2026-11-12 08:30:15',
    ai_result: {
      extracted_text: 'Đoạn đường Nguyễn Ái Quốc gần ngã tư Tân Phong, thành phố Biên Hòa bị sụt lún xuất hiện nhiều ổ gà lớn, phương tiện giao thông di chuyển dễ té ngã liên tục. Đề nghị cơ quan chức năng sửa chữa gấp cho người dân.',
      summary: 'Đường Nguyễn Ái Quốc gần ngã tư Tân Phong (Biên Hòa) bị sụt lún, xuất hiện ổ gà gây nguy cơ tai nạn giao thông.',
      department_code: 'SO_GTVT',
      priority: 'CAO',
      confidence_score: 0.96,
      entities: {
        locations: ['Đường Nguyễn Ái Quốc', 'Ngã tư Tân Phong', 'TP. Biên Hòa'],
        issues: ['Sụt lún mặt đường', 'Ổ gà lớn', 'Nguy cơ tai nạn giao thông']
      },
      legal_basis: 'Điều 37, Điều 38 Luật Giao thông đường bộ 2008 và Nghị định 11/2010/NĐ-CP về quản lý và bảo vệ kết cấu hạ tầng giao thông đường bộ.',
      draft_reply: 'Kính gửi ông Nguyễn Văn Hùng,\n\nSở Giao thông Vận tải tỉnh Đồng Nai trân trọng cảm ơn thông tin phản ánh kịp thời của ông về tình trạng hư hỏng mặt đường tại tuyến đường Nguyễn Ái Quốc, đoạn gần ngã tư Tân Phong, TP. Biên Hòa.\n\nSau khi tiếp nhận phản ánh, Sở đã khẩn trương chỉ đạo Ban Quản lý bảo trì đường bộ phối hợp Công ty CP Quản lý Đô thị kiểm tra hiện trường, cắm biển cảnh báo an toàn và lên phương án dặm vá, xử lý triệt để các vị trí sụt lún trong vòng 24 giờ tới.\n\nTrân trọng phản hồi đến ông được rõ.'
    }
  },
  {
    ticket_id: 2,
    tracking_code: 'ĐN-20261112-002',
    ticket_code: 'ĐN-20261112-002',
    source: 'EMAIL',
    citizen_name: 'Trần Thị Mai',
    citizen_phone: '0988765432',
    citizen_email: 'mai.tran@gmail.com',
    raw_text: 'Kính gửi UBND TP. Biên Hòa: Tôi tên Trần Thị Mai ngụ tại KP4 Trảng Dài phản ánh nhà hàng xóm thường xuyên mở loa kẹo kéo hát hò ồn ào đến 1-2h sáng không ai ngủ được, kính đề nghị cơ quan chức năng kiểm tra và xử lý theo quy định.',
    image_url: null,
    image_urls: [],
    status: 'ROUTED',
    dept_code: 'UBND_CAP_HUYEN',
    dept_name: 'UBND TP. Biên Hòa',
    priority: 'TRUNG_BINH',
    created_at: '2026-11-12 08:45:20',
    ai_result: {
      extracted_text: 'Đơn kiến nghị: Tôi tên Trần Thị Mai, thường trú tại Khu phố 4, phường Trảng Dài, thành phố Biên Hòa. Tôi xin phản ánh hộ gia đình hàng xóm thường xuyên mở loa kẹo kéo công suất lớn hát karaoke từ tối đến 1-2 giờ sáng, gây ô nhiễm tiếng ồn nghiêm trọng, ảnh hưởng sức khỏe người già và việc học của các cháu nhỏ. Kính mong chính quyền can thiệp xử lý.',
      summary: 'Hộ dân tại KP4, phường Trảng Dài sử dụng loa kẹo kéo hát karaoke quá 22h đêm gây ô nhiễm tiếng ồn khu dân cư.',
      department_code: 'UBND_CAP_HUYEN',
      priority: 'TRUNG_BINH',
      confidence_score: 0.94,
      entities: {
        locations: ['Khu phố 4', 'Phường Trảng Dài', 'TP. Biên Hòa'],
        issues: ['Hát karaoke loa kẹo kéo quá 22h', 'Gây tiếng ồn khu dân cư']
      },
      legal_basis: 'Điều 8 Nghị định số 144/2021/NĐ-CP quy định về xử phạt vi phạm hành chính lĩnh vực an ninh trật tự (bảo đảm sự yên tĩnh chung); Luật Tổ chức chính quyền địa phương 2015.',
      draft_reply: 'Kính gửi bà Trần Thị Mai,\n\nỦy ban nhân dân thành phố Biên Hòa đã tiếp nhận thông tin phản ánh của bà về tình trạng gây mất trật tự, ô nhiễm tiếng ồn do mở loa karaoke đêm khuya tại Khu phố 4, phường Trảng Dài.\n\nUBND thành phố đã giao Chủ tịch UBND phường Trảng Dài chỉ đạo Công an phường phối hợp Ban Chỉ huy Quân sự và Ban điều hành Khu phố 4 kiểm tra trực tiếp, lập biên bản nhắc nhở, cam kết không tái phạm; xử phạt nghiêm nếu tiếp tục vi phạm sau 22 giờ theo quy định tại Nghị định 144/2021/NĐ-CP.\n\nKết quả xử lý cụ thể sẽ được thông báo đến bà trong thời hạn 03 ngày làm việc.'
    }
  }
];

export const ticketService = {
  /**
   * 1. Tiếp nhận đơn: POST /api/tickets/submit
   */
  async submitTicket(data, fileOrFiles = null) {
    try {
      const formData = new FormData();
      if (data.citizen_name) formData.append('citizen_name', data.citizen_name);
      if (data.citizen_phone) formData.append('citizen_phone', data.citizen_phone);
      if (data.citizen_email) formData.append('citizen_email', data.citizen_email);
      if (data.raw_text) formData.append('raw_text', data.raw_text);
      if (data.source) formData.append('source', data.source);

      let fileList = [];
      if (fileOrFiles) {
        if (Array.isArray(fileOrFiles)) fileList = fileOrFiles;
        else if (fileOrFiles instanceof FileList) fileList = Array.from(fileOrFiles);
        else fileList = [fileOrFiles];
      }

      for (let i = 0; i < fileList.length; i++) {
        const compressed = await compressImage(fileList[i]);
        formData.append('files', compressed);
      }

      try {
        const response = await httpClient.post('/api/tickets/submit', formData, {
          timeout: 60000
        });
        if (response && (response.tracking_code || response.ticket_code)) {
          return {
            success: true,
            ...response,
            tracking_code: response.tracking_code || response.ticket_code,
            ticket_code: response.ticket_code || response.tracking_code,
            data: response
          };
        }
      } catch (backendError) {
        console.warn('Lỗi kết nối API submitTicket, dùng fallback local:', backendError.message);
      }

      // Thuật toán đối soát từ khóa thông minh phân bổ 7 Sở / Một cửa (Fallback local)
      const textLower = (data.raw_text || '').toLowerCase();
      let routedDept = 'UBND_CAP_HUYEN';
      let deptName = 'Bộ phận Một cửa / UBND Cấp Huyện';
      let priority = 'TRUNG_BINH';

      if (textLower.includes('karaoke') || textLower.includes('ồn ào') || textLower.includes('tiếng ồn') || textLower.includes('trộm') || textLower.includes('an ninh') || textLower.includes('gây rối') || textLower.includes('loa kẹo kéo')) {
        routedDept = 'CONG_AN_TINH';
        deptName = 'Công an Tỉnh Đồng Nai';
        priority = 'CAO';
      } else if (textLower.includes('sổ đỏ') || textLower.includes('đất') || textLower.includes('rác') || textLower.includes('ô nhiễm') || textLower.includes('xả thải') || textLower.includes('khói bụi')) {
        routedDept = 'SO_TNMT';
        deptName = 'Sở Tài nguyên & Môi trường';
      } else if (textLower.includes('xây dựng') || textLower.includes('vỉa hè') || textLower.includes('sai phép') || textLower.includes('trái phép') || textLower.includes('công trình') || textLower.includes('nứt')) {
        routedDept = 'SO_XD';
        deptName = 'Sở Xây dựng';
      } else if (textLower.includes('giao thông') || textLower.includes('đường') || textLower.includes('ổ gà') || textLower.includes('sụt lún') || textLower.includes('đèn tín hiệu') || textLower.includes('cầu')) {
        routedDept = 'SO_GTVT';
        deptName = 'Sở Giao thông Vận tải';
      } else if (textLower.includes('bệnh viện') || textLower.includes('y tế') || textLower.includes('ngộ độc') || textLower.includes('thuốc') || textLower.includes('bhyt')) {
        routedDept = 'SO_YTE';
        deptName = 'Sở Y tế';
      } else if (textLower.includes('học') || textLower.includes('trường') || textLower.includes('giáo viên') || textLower.includes('học phí')) {
        routedDept = 'SO_GDDT';
        deptName = 'Sở Giáo dục & Đào tạo';
      } else if (textLower.includes('lương') || textLower.includes('bhxh') || textLower.includes('lao động') || textLower.includes('trợ cấp')) {
        routedDept = 'SO_LDTBXH';
        deptName = 'Sở Lao động - Thương binh & Xã hội';
      }

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}${mm}${dd}`;
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const trackingCode = `ĐN-${dateStr}-${randomNum}`;

      let cleanSummary = (data.raw_text || '')
        .replace(/\[Địa chỉ:[^\]]*\]/gi, '')
        .replace(/\[Tiêu đề:[^\]]*\]/gi, '')
        .trim();
      if (!cleanSummary) cleanSummary = 'Phản ánh, kiến nghị trực tuyến của công dân';
      if (cleanSummary.length > 120) {
        cleanSummary = cleanSummary.slice(0, 120).trim() + '...';
      }

      const newTicket = {
        ticket_id: Date.now(),
        tracking_code: trackingCode,
        ticket_code: trackingCode,
        source: data.source || 'WEB_TEXT',
        citizen_name: data.citizen_name || 'Công dân',
        citizen_phone: data.citizen_phone || '',
        citizen_email: data.citizen_email || '',
        raw_text: data.raw_text || 'Nội dung phản ánh, kiến nghị trực tuyến của công dân',
        image_url: null,
        image_urls: [],
        status: 'ROUTED',
        dept_code: routedDept,
        dept_name: deptName,
        priority: priority,
        created_at: new Date().toLocaleString('vi-VN'),
        ai_result: {
          is_fallback: true,
          extracted_text: data.raw_text || 'Nội dung phản ánh của công dân',
          summary: cleanSummary,
          department_code: routedDept,
          priority: priority,
          confidence_score: 0.65,
          entities: {
            locations: ['Đồng Nai'],
            issues: ['Phản ánh, kiến nghị']
          },
          legal_basis: 'Quy tắc nghiệp vụ phân loại và điều phối đơn thư tỉnh Đồng Nai',
          draft_reply: `Kính gửi Quý công dân, UBND tỉnh Đồng Nai đã ghi nhận nội dung phản ánh và phân công ${deptName} khẩn trương kiểm tra thực địa, xử lý theo thẩm quyền.`
        }
      };

      localTickets.unshift(newTicket);
      return { success: true, tracking_code: trackingCode, ticket_code: trackingCode, data: newTicket };
    } catch (error) {
      console.error('Lỗi khi gửi đơn:', error);
      throw error;
    }
  },

  /**
   * Lấy lịch sử đơn thư của công dân: GET /api/citizen/my-tickets
   */
  async getMyTickets(email = null) {
    try {
      const res = await httpClient.get('/api/citizen/my-tickets', {
        params: email ? { email } : {}
      });
      if (Array.isArray(res)) return res;
    } catch (e) {
      console.error('Lỗi khi tải lịch sử đơn thư:', e);
    }
    if (email) {
      return localTickets.filter(t => t.citizen_email?.toLowerCase() === email.toLowerCase());
    }
    return localTickets.filter(t => t.source === 'WEB_TEXT' || t.source === 'EMAIL');
  },

  /**
   * 2. Lấy danh sách hồ sơ: GET /api/tickets
   */
  async getTickets(filters = {}) {
    try {
      try {
        const res = await httpClient.get('/api/tickets', { params: filters });
        if (Array.isArray(res)) return res;
      } catch (e) {}

      let result = [...localTickets];
      if (filters.dept_code && filters.dept_code !== 'ALL') {
        result = result.filter(t => t.dept_code === filters.dept_code);
      }
      if (filters.source && filters.source !== 'ALL') {
        result = result.filter(t => t.source === filters.source);
      }
      if (filters.priority && filters.priority !== 'ALL') {
        result = result.filter(t => t.priority === filters.priority);
      }
      if (filters.status && filters.status !== 'ALL') {
        result = result.filter(t => t.status === filters.status);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(t =>
          (t.tracking_code && t.tracking_code.toLowerCase().includes(q)) ||
          (t.raw_text && t.raw_text.toLowerCase().includes(q)) ||
          (t.citizen_name && t.citizen_name.toLowerCase().includes(q)) ||
          (t.ai_result?.summary && t.ai_result.summary.toLowerCase().includes(q))
        );
      }
      return result;
    } catch (err) {
      console.error('Lỗi lấy danh sách hồ sơ:', err);
      return localTickets;
    }
  },

  /**
   * 3. Tra cứu hồ sơ: GET /api/tickets/lookup/{tracking_code}
   */
  async lookupTicket(trackingCode) {
    const cleanCode = trackingCode.trim().toUpperCase();
    try {
      const res = await httpClient.get(`/api/tickets/lookup/${encodeURIComponent(cleanCode)}`);
      if (res && res.ticket_id) {
        if (!res.ticket_code) res.ticket_code = res.tracking_code;
        return res;
      }
    } catch (e) {}

    const ticket = localTickets.find(t => 
      (t.tracking_code && t.tracking_code.toUpperCase() === cleanCode) ||
      (t.ticket_code && t.ticket_code.toUpperCase() === cleanCode)
    );
    if (!ticket) {
      throw new Error(`Không tìm thấy hồ sơ với mã "${cleanCode}". Vui lòng kiểm tra lại.`);
    }
    return ticket;
  },

  /**
   * 4. Cán bộ phê duyệt: PUT /api/tickets/{id}/approve
   */
  async approveTicket(ticketId, approvalData) {
    try {
      const res = await httpClient.put(`/api/tickets/${ticketId}/approve`, approvalData);
      if (res) return res;
    } catch (e) {}

    const idx = localTickets.findIndex(t => t.ticket_id === ticketId);
    if (idx !== -1) {
      localTickets[idx].status = 'APPROVED';
      if (approvalData.draft_reply) {
        localTickets[idx].ai_result.draft_reply = approvalData.draft_reply;
      }
      if (approvalData.extracted_text) {
        localTickets[idx].ai_result.extracted_text = approvalData.extracted_text;
      }
      if (approvalData.department_code) {
        localTickets[idx].dept_code = approvalData.department_code;
      }
      return { success: true, ticket: localTickets[idx] };
    }
    throw new Error('Hồ sơ không tồn tại.');
  },

  /**
   * 4b. Chuyển cơ quan thụ lý thủ công: PUT /api/tickets/{id}/transfer
   */
  async transferTicket(ticketId, transferData) {
    let payload = {};
    if (typeof transferData === 'string') {
      payload = { target_dept: transferData, notes: '' };
    } else if (transferData && typeof transferData === 'object') {
      payload = {
        target_dept: transferData.target_dept || transferData.department_code || 'REQUIRE_HUMAN_REVIEW',
        notes: transferData.notes || transferData.reason || '',
      };
    }

    try {
      const res = await httpClient.put(`/api/tickets/${ticketId}/transfer`, payload);
      if (res) return res;
    } catch (e) {}

    const idx = localTickets.findIndex(t => t.ticket_id === ticketId);
    if (idx !== -1) {
      const target = payload.target_dept;
      localTickets[idx].dept_code = target;
      localTickets[idx].status = target === 'REQUIRE_HUMAN_REVIEW' ? 'HUMAN_REVIEW' : 'ROUTED';
      if (payload.notes) {
        localTickets[idx].admin_note = payload.notes;
      }
      return { success: true, ticket: localTickets[idx] };
    }
    throw new Error('Hồ sơ không tồn tại.');
  },

  /**
   * 4c. Chuyển tuyến thủ công chính thức: PUT /api/tickets/{id}/reassign
   */
  async reassignTicket(ticketId, data) {
    let payload = {
      department_code: data.department_code || data.target_dept || 'SO_GTVT',
      reason: data.reason || data.notes || '',
      reassigned_by: data.reassigned_by || 'Cán bộ thụ lý',
    };

    try {
      const res = await httpClient.put(`/api/tickets/${ticketId}/reassign`, payload);
      if (res) return res;
    } catch (e) {}

    const idx = localTickets.findIndex(t => t.ticket_id === ticketId);
    if (idx !== -1) {
      const target = payload.department_code;
      const deptNames = {
        SO_GTVT: 'Sở Giao thông Vận tải',
        SO_TNMT: 'Sở Tài nguyên & Môi trường',
        SO_XD: 'Sở Xây dựng',
        SO_XAYDUNG: 'Sở Xây dựng',
        SO_YTE: 'Sở Y tế',
        SO_GDDT: 'Sở Giáo dục & Đào tạo',
        SO_LDTBXH: 'Sở Lao động - Thương binh & Xã hội',
        CONG_AN_TINH: 'Công an Tỉnh Đồng Nai',
        UBND_CAP_HUYEN: 'UBND Cấp Huyện / TP',
        UBND_TINH: 'UBND Tỉnh Đồng Nai',
        REQUIRE_HUMAN_REVIEW: 'Cần Phân Luồng Thủ Công'
      };
      localTickets[idx].dept_code = target;
      localTickets[idx].department_code = target;
      localTickets[idx].dept_name = deptNames[target] || target;
      localTickets[idx].status = target === 'REQUIRE_HUMAN_REVIEW' ? 'HUMAN_REVIEW' : 'ROUTED';
      const logEntry = `[${new Date().toLocaleString('vi-VN')}] ${payload.reassigned_by} chuyển tuyến sang ${localTickets[idx].dept_name}. Lý do: ${payload.reason}`;
      localTickets[idx].admin_note = localTickets[idx].admin_note ? `${localTickets[idx].admin_note}\n${logEntry}` : logEntry;
      return { success: true, ticket: localTickets[idx] };
    }
    throw new Error('Hồ sơ không tồn tại.');
  },

  /**
   * 5. Admin điều phối hồ sơ ngoại lệ: POST /api/admin/dispatch
   */
  async dispatchException(ticketId, targetDeptCode, note = '') {
    const deptNames = {
      SO_GTVT: 'Sở Giao thông Vận tải',
      SO_TNMT: 'Sở Tài nguyên & Môi trường',
      SO_XD: 'Sở Xây dựng',
      SO_XAYDUNG: 'Sở Xây dựng',
      SO_YTE: 'Sở Y tế',
      SO_GDDT: 'Sở Giáo dục & Đào tạo',
      SO_LDTBXH: 'Sở Lao động - Thương binh & Xã hội',
      CONG_AN_TINH: 'Công an Tỉnh Đồng Nai',
      UBND_CAP_HUYEN: 'UBND Cấp Huyện / TP',
      UBND_TINH: 'UBND Tỉnh Đồng Nai',
    };

    try {
      const res = await httpClient.post('/api/admin/dispatch', { 
        ticket_id: ticketId, 
        target_dept: targetDeptCode, 
        note 
      });
      if (res) return res;
    } catch (e) {}

    const idx = localTickets.findIndex(t => t.ticket_id === ticketId);
    if (idx !== -1) {
      localTickets[idx].status = 'ROUTED';
      localTickets[idx].dept_code = targetDeptCode;
      localTickets[idx].dept_name = deptNames[targetDeptCode] || targetDeptCode;
      if (note) {
        localTickets[idx].admin_note = note;
      }
      return { success: true, ticket: localTickets[idx] };
    }
    throw new Error('Hồ sơ không tồn tại.');
  },

  /**
   * 6. Admin đánh dấu đơn rác: PUT /api/admin/tickets/{id}/spam
   */
  async markAsSpam(ticketId, reason = 'Đơn rác, không có sự việc cụ thể') {
    try {
      const res = await httpClient.put(`/api/admin/tickets/${ticketId}/spam`, { reason });
      if (res) return res;
    } catch (e) {}

    const idx = localTickets.findIndex(t => t.ticket_id === ticketId);
    if (idx !== -1) {
      localTickets[idx].status = 'REJECTED';
      localTickets[idx].dept_name = 'Đã Loại Bỏ (Đơn Rác)';
      localTickets[idx].rejection_reason = reason;
      return { success: true, ticket: localTickets[idx] };
    }
    throw new Error('Hồ sơ không tồn tại.');
  },

  /**
   * 6b. Thống kê giám sát hệ thống: GET /api/admin/stats
   */
  async getSystemStats() {
    try {
      const res = await httpClient.get('/api/admin/stats');
      if (res && res.departments) return res;
    } catch (e) {}

    const total = localTickets.length;
    const byDept = {
      SO_GTVT: localTickets.filter(t => t.dept_code === 'SO_GTVT').length,
      SO_TNMT: localTickets.filter(t => t.dept_code === 'SO_TNMT').length,
      SO_XD: localTickets.filter(t => t.dept_code === 'SO_XD' || t.dept_code === 'SO_XAYDUNG').length,
      UBND_CAP_HUYEN: localTickets.filter(t => t.dept_code === 'UBND_CAP_HUYEN').length,
      UBND_TINH: localTickets.filter(t => t.dept_code === 'UBND_TINH').length,
      REQUIRE_HUMAN_REVIEW: localTickets.filter(t => t.dept_code === 'REQUIRE_HUMAN_REVIEW' || t.status === 'HUMAN_REVIEW').length,
    };

    const confScores = localTickets
      .map(t => t.ai_result?.confidence_score)
      .filter(s => typeof s === 'number');
    const avgConf = confScores.length > 0 
      ? Number((confScores.reduce((a, b) => a + b, 0) / confScores.length).toFixed(2)) 
      : 0.95;

    return {
      total_tickets: total,
      departments: {
        SO_GTVT: { code: 'SO_GTVT', name: 'Sở Giao thông Vận tải', count: byDept.SO_GTVT },
        SO_TNMT: { code: 'SO_TNMT', name: 'Sở Tài nguyên & Môi trường', count: byDept.SO_TNMT },
        SO_XD: { code: 'SO_XD', name: 'Sở Xây dựng', count: byDept.SO_XD },
        UBND_CAP_HUYEN: { code: 'UBND_CAP_HUYEN', name: 'UBND Cấp Huyện / TP', count: byDept.UBND_CAP_HUYEN },
        UBND_TINH: { code: 'UBND_TINH', name: 'UBND Tỉnh Đồng Nai', count: byDept.UBND_TINH },
        REQUIRE_HUMAN_REVIEW: { code: 'REQUIRE_HUMAN_REVIEW', name: 'Hàng Đợi Ngoại Lệ', count: byDept.REQUIRE_HUMAN_REVIEW },
      },
      status_counts: {
        ROUTED: localTickets.filter(t => t.status === 'ROUTED').length,
        APPROVED: localTickets.filter(t => t.status === 'APPROVED').length,
        REJECTED: localTickets.filter(t => t.status === 'REJECTED').length,
        HUMAN_REVIEW: byDept.REQUIRE_HUMAN_REVIEW,
      },
      ai_avg_confidence: avgConf,
      ai_avg_confidence_percent: Math.round(avgConf * 100),
    };
  },

  /**
   * Kích hoạt đồng bộ thư từ Gmail thật: POST /api/tickets/sync-gmail
   */
  async syncGmail(params = {}) {
    try {
      const res = await httpClient.post('/api/tickets/sync-gmail', params);
      return res;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi kết nối đồng bộ Gmail.';
      throw new Error(msg);
    }
  },

  getImageUrl,
  compressImage,
};

export default ticketService;

