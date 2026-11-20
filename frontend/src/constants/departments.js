/**
 * Danh mục Sở/Ban/Ngành Chuẩn Toàn Hệ Thống (Single Source of Truth - SSOT)
 * Cổng Dịch Vụ Công & Điều Phối Đơn Thư Tỉnh Đồng Nai
 */

export const DEPARTMENTS = [
  {
    code: 'SO_GTVT',
    name: 'Sở Giao thông Vận tải',
    short_name: 'Sở GTVT',
    email: 'sgtvt@dongnai.gov.vn',
    is_selectable_for_officer: true,
  },
  {
    code: 'SO_TNMT',
    name: 'Sở Tài nguyên & Môi trường',
    short_name: 'Sở TN&MT',
    email: 'stnmt@dongnai.gov.vn',
    is_selectable_for_officer: true,
  },
  {
    code: 'SO_XD',
    name: 'Sở Xây dựng',
    short_name: 'Sở Xây dựng',
    email: 'sxd@dongnai.gov.vn',
    is_selectable_for_officer: true,
  },
  {
    code: 'SO_YTE',
    name: 'Sở Y tế',
    short_name: 'Sở Y tế',
    email: 'syte@dongnai.gov.vn',
    is_selectable_for_officer: true,
  },
  {
    code: 'SO_GDDT',
    name: 'Sở Giáo dục & Đào tạo',
    short_name: 'Sở GD&ĐT',
    email: 'sgddt@dongnai.gov.vn',
    is_selectable_for_officer: true,
  },
  {
    code: 'SO_LDTBXH',
    name: 'Sở Lao động - Thương binh & Xã hội',
    short_name: 'Sở LĐ-TB&XH',
    email: 'sldtbxh@dongnai.gov.vn',
    is_selectable_for_officer: true,
  },
  {
    code: 'CONG_AN_TINH',
    name: 'Công an Tỉnh Đồng Nai',
    short_name: 'Công an Tỉnh',
    email: 'congan@dongnai.gov.vn',
    is_selectable_for_officer: true,
  },
  {
    code: 'UBND_CAP_HUYEN',
    name: 'Ban Tiếp công dân Tỉnh',
    short_name: 'Ban Tiếp công dân Tỉnh',
    email: 'ubnd.bienhoa@dongnai.gov.vn',
    is_selectable_for_officer: true,
  },
];

export const ALL_DEPARTMENTS = [
  ...DEPARTMENTS,
  {
    code: 'UBND_TINH',
    name: 'Ủy ban Nhân dân Tỉnh Đồng Nai',
    short_name: 'UBND Tỉnh',
    email: 'ubnd@dongnai.gov.vn',
    is_selectable_for_officer: false,
  },
  {
    code: 'REQUIRE_HUMAN_REVIEW',
    name: 'Tổ Tiếp nhận & Điều phối Đơn thư Tỉnh',
    short_name: 'Cần điều phối',
    email: 'admin.donthu@dongnai.gov.vn',
    is_selectable_for_officer: false,
  },
];

export const DEPT_ALIAS_MAP = {
  SO_GTVT: 'SO_GTVT',
  SO_GIAOTHONG: 'SO_GTVT',
  GTVT: 'SO_GTVT',
  SGTVT: 'SO_GTVT',

  SO_TNMT: 'SO_TNMT',
  SO_TAINGUYEN: 'SO_TNMT',
  TNMT: 'SO_TNMT',
  STNMT: 'SO_TNMT',

  SO_XD: 'SO_XD',
  SO_XAYDUNG: 'SO_XD',
  XAYDUNG: 'SO_XD',
  SXD: 'SO_XD',

  SO_YTE: 'SO_YTE',
  SO_YT: 'SO_YTE',
  YTE: 'SO_YTE',
  SYT: 'SO_YTE',

  SO_GDDT: 'SO_GDDT',
  SO_GD: 'SO_GDDT',
  SO_GIAODUC: 'SO_GDDT',
  GDDT: 'SO_GDDT',
  SGDDT: 'SO_GDDT',

  SO_LDTBXH: 'SO_LDTBXH',
  SO_LD: 'SO_LDTBXH',
  SO_LAODONG: 'SO_LDTBXH',
  LDTBXH: 'SO_LDTBXH',
  SLDTBXH: 'SO_LDTBXH',

  CONG_AN_TINH: 'CONG_AN_TINH',
  CAT: 'CONG_AN_TINH',
  CONGAN: 'CONG_AN_TINH',

  UBND_CAP_HUYEN: 'UBND_CAP_HUYEN',
  UBND_HUYEN: 'UBND_CAP_HUYEN',
  MOT_CUA: 'UBND_CAP_HUYEN',
  MOTCUA: 'UBND_CAP_HUYEN',
  BO_PHAN_MOT_CUA: 'UBND_CAP_HUYEN',

  UBND_TINH: 'UBND_TINH',
  UBND: 'UBND_TINH',

  REQUIRE_HUMAN_REVIEW: 'REQUIRE_HUMAN_REVIEW',
  HUMAN_REVIEW: 'REQUIRE_HUMAN_REVIEW',
};

export const DEPARTMENT_MAP = ALL_DEPARTMENTS.reduce((acc, curr) => {
  acc[curr.code] = curr;
  return acc;
}, {});

export const normalizeDeptCode = (code) => {
  if (!code) return 'REQUIRE_HUMAN_REVIEW';
  const clean = String(code).trim().toUpperCase();
  return DEPT_ALIAS_MAP[clean] || clean;
};

export const getDepartmentName = (code, fallback = '') => {
  const norm = normalizeDeptCode(code);
  if (DEPARTMENT_MAP[norm]) {
    return DEPARTMENT_MAP[norm].name;
  }
  return fallback || code || 'Chưa phân tuyến';
};

export const getDepartmentShortName = (code, fallback = '') => {
  const norm = normalizeDeptCode(code);
  if (DEPARTMENT_MAP[norm]) {
    return DEPARTMENT_MAP[norm].short_name;
  }
  return fallback || code || 'Chưa phân tuyến';
};

export const DEPARTMENT_HEADERS = {
  SO_GTVT: ['SỞ GIAO THÔNG VẬN TẢI TỈNH ĐỒNG NAI', 'Số: .../TB-SGTVT'],
  SO_TNMT: ['SỞ TÀI NGUYÊN VÀ MÔI TRƯỜNG TỈNH ĐỒNG NAI', 'Số: .../TB-STNMT'],
  SO_XD: ['SỞ XÂY DỰNG TỈNH ĐỒNG NAI', 'Số: .../TB-SXD'],
  SO_XAYDUNG: ['SỞ XÂY DỰNG TỈNH ĐỒNG NAI', 'Số: .../TB-SXD'],
  SO_YTE: ['SỞ Y TẾ TỈNH ĐỒNG NAI', 'Số: .../TB-SYT'],
  SO_YT: ['SỞ Y TẾ TỈNH ĐỒNG NAI', 'Số: .../TB-SYT'],
  SO_GDDT: ['SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI', 'Số: .../TB-SGDĐT'],
  SO_LDTBXH: ['SỞ LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI TỈNH ĐỒNG NAI', 'Số: .../TB-SLĐTBXH'],
  CONG_AN_TINH: ['CÔNG AN TỈNH ĐỒNG NAI', 'Số: .../TB-CAT'],
  UBND_TINH: ['ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI', 'Số: .../TB-UBND'],
  UBND_CAP_HUYEN: ['ỦY BAN NHÂN DÂN CẤP HUYỆN / TP', 'Số: .../TB-UBND'],
  REQUIRE_HUMAN_REVIEW: ['TỔ TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ TỈNH ĐỒNG NAI', 'Số: .../TB-TĐP'],
};
