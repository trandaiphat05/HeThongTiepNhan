import { getDepartmentName, normalizeDeptCode, DEPARTMENT_MAP } from '../constants/departments';

/**
 * Định dạng nhãn Kênh tiếp nhận hồ sơ sang tiếng Việt hành chính chuẩn mực
 */
export const formatSourceLabel = (src) => {
  const map = {
    'ONE_STOP': 'Ban Tiếp công dân',
    'WEB_TEXT': 'Cổng DVC Trực tuyến',
    'WEB_IMAGE': 'Văn bản số hóa',
    'EMAIL': 'Thư điện tử (Gmail)',
  };
  return map[src] || src || 'Ban Tiếp công dân';
};

/**
 * Định dạng tên Cơ quan / Phòng ban thụ lý, loại bỏ mã code viết hoa
 * Sử dụng Single Source of Truth từ constants/departments
 */
export const formatDeptName = (code, name) => {
  if (name && !name.includes('_') && name !== code) {
    return name;
  }
  return getDepartmentName(code, name);
};

/**
 * Định dạng Lĩnh vực AI nhận diện từ mã cơ quan hoặc lĩnh vực
 */
export const formatCategoryName = (deptCode, category) => {
  if (category && !category.includes('_') && category.length > 2) {
    return category;
  }
  const norm = normalizeDeptCode(deptCode);
  const map = {
    'SO_GTVT': 'Giao thông Vận tải & Cầu đường',
    'SO_TNMT': 'Đất đai, Môi trường & Khoáng sản',
    'SO_XD': 'Xây dựng, Quy hoạch & Trật tự Đô thị',
    'SO_YTE': 'Y tế, Sức khỏe & An toàn Thực phẩm',
    'SO_GDDT': 'Giáo dục & Đào tạo',
    'SO_LDTBXH': 'Lao động - Thương binh & Xã hội',
    'CONG_AN_TINH': 'An ninh Trật tự & An toàn Xã hội',
    'UBND_CAP_HUYEN': 'Tiếp công dân & Quản lý Địa phương',
    'UBND_TINH': 'Quản lý Hành chính Tỉnh Đồng Nai',
    'REQUIRE_HUMAN_REVIEW': 'Lĩnh vực Cần Thẩm Tra Thủ Công',
  };
  return map[norm] || 'Hành chính Công vụ';
};

/**
 * Định dạng nhãn Mức độ ưu tiên chuẩn mực
 */
export const formatPriorityLabel = (priority) => {
  const p = (priority || '').toUpperCase();
  if (p === 'KHAN_CAP' || p === 'KHAN' || p === 'EMERGENCY') {
    return { label: 'Khẩn cấp', colorClass: 'bg-red-100 text-red-800 border-red-300' };
  }
  if (p === 'CAO' || p === 'HIGH') {
    return { label: 'Cao', colorClass: 'bg-amber-100 text-amber-800 border-amber-300' };
  }
  if (p === 'THAP' || p === 'LOW') {
    return { label: 'Tiêu chuẩn', colorClass: 'bg-slate-100 text-slate-700 border-slate-300' };
  }
  return { label: 'Bình thường', colorClass: 'bg-blue-100 text-blue-800 border-blue-300' };
};

/**
 * Danh sách 7 Sở/Ngành nghiệp vụ trọng điểm cùng UBND Cấp Huyện
 */
export const OFFICIAL_DEPARTMENTS = [
  { code: 'SO_GTVT', name: 'Sở Giao thông Vận tải' },
  { code: 'SO_TNMT', name: 'Sở Tài nguyên & Môi trường' },
  { code: 'SO_XD', name: 'Sở Xây dựng' },
  { code: 'SO_YTE', name: 'Sở Y tế' },
  { code: 'SO_GDDT', name: 'Sở Giáo dục & Đào tạo' },
  { code: 'SO_LDTBXH', name: 'Sở Lao động - Thương binh & Xã hội' },
  { code: 'CONG_AN_TINH', name: 'Công an Tỉnh Đồng Nai' },
  { code: 'UBND_CAP_HUYEN', name: 'UBND Cấp Huyện / TP' },
];
