"""
Danh mục Sở/Ban/Ngành Chuẩn Toàn Hệ Thống (Single Source of Truth - SSOT)
Tỉnh Đồng Nai
"""

from typing import List, Dict, Any, Optional

CANONICAL_DEPARTMENTS: List[Dict[str, Any]] = [
    {
        "code": "SO_GTVT",
        "name": "Sở Giao thông Vận tải",
        "short_name": "Sở GTVT",
        "email": "sgtvt@dongnai.gov.vn",
        "is_selectable_for_officer": True,
        "aliases": ["SO_GIAOTHONG", "GTVT", "SGTVT"],
    },
    {
        "code": "SO_TNMT",
        "name": "Sở Tài nguyên và Môi trường",
        "short_name": "Sở TN&MT",
        "email": "stnmt@dongnai.gov.vn",
        "is_selectable_for_officer": True,
        "aliases": ["SO_TAINGUYEN", "TNMT", "STNMT"],
    },
    {
        "code": "SO_XD",
        "name": "Sở Xây dựng",
        "short_name": "Sở Xây dựng",
        "email": "sxd@dongnai.gov.vn",
        "is_selectable_for_officer": True,
        "aliases": ["SO_XAYDUNG", "XAYDUNG", "SXD"],
    },
    {
        "code": "SO_YTE",
        "name": "Sở Y tế",
        "short_name": "Sở Y tế",
        "email": "syte@dongnai.gov.vn",
        "is_selectable_for_officer": True,
        "aliases": ["SO_YT", "YTE", "SYT"],
    },
    {
        "code": "SO_GDDT",
        "name": "Sở Giáo dục và Đào tạo",
        "short_name": "Sở GD&ĐT",
        "email": "sgddt@dongnai.gov.vn",
        "is_selectable_for_officer": True,
        "aliases": ["SO_GIAODUC", "GDDT", "SGDDT"],
    },
    {
        "code": "SO_LDTBXH",
        "name": "Sở Lao động - Thương binh và Xã hội",
        "short_name": "Sở LĐ-TB&XH",
        "email": "sldtbxh@dongnai.gov.vn",
        "is_selectable_for_officer": True,
        "aliases": ["SO_LAODONG", "LDTBXH", "SLDTBXH"],
    },
    {
        "code": "CONG_AN_TINH",
        "name": "Công an Tỉnh Đồng Nai",
        "short_name": "Công an Tỉnh",
        "email": "congan@dongnai.gov.vn",
        "is_selectable_for_officer": True,
        "aliases": ["CAT", "CONGAN"],
    },
    {
        "code": "UBND_CAP_HUYEN",
        "name": "Ban Tiếp công dân Tỉnh",
        "short_name": "Ban Tiếp công dân Tỉnh",
        "email": "ubnd.bienhoa@dongnai.gov.vn",
        "is_selectable_for_officer": True,
        "aliases": ["UBND_HUYEN", "MOT_CUA", "MOTCUA", "BO_PHAN_MOT_CUA", "BAN_TIEP_CONG_DAN"],
    },
    {
        "code": "UBND_TINH",
        "name": "Ủy ban Nhân dân Tỉnh Đồng Nai",
        "short_name": "UBND Tỉnh",
        "email": "ubnd@dongnai.gov.vn",
        "is_selectable_for_officer": False,
        "aliases": ["UBND"],
    },
    {
        "code": "REQUIRE_HUMAN_REVIEW",
        "name": "Tổ Tiếp nhận & Điều phối Đơn thư Tỉnh",
        "short_name": "Cần điều phối",
        "email": "admin.donthu@dongnai.gov.vn",
        "is_selectable_for_officer": False,
        "aliases": ["HUMAN_REVIEW", "CAN_DIEU_PHOI"],
    },
]

# Từ điển tra cứu nhanh theo mã code và bí danh (alias)
DEPARTMENT_MAP: Dict[str, Dict[str, Any]] = {d["code"]: d for d in CANONICAL_DEPARTMENTS}

# Ánh xạ bí danh về mã chuẩn
DEPT_ALIAS_MAP: Dict[str, str] = {}
for d in CANONICAL_DEPARTMENTS:
    DEPT_ALIAS_MAP[d["code"]] = d["code"]
    for alias in d.get("aliases", []):
        DEPT_ALIAS_MAP[alias] = d["code"]

# Bổ sung các bí danh phổ biến khác
DEPT_ALIAS_MAP["SO_XAYDUNG"] = "SO_XD"
DEPT_ALIAS_MAP["SO_YT"] = "SO_YTE"
DEPT_ALIAS_MAP["SO_GD"] = "SO_GDDT"
DEPT_ALIAS_MAP["SO_LD"] = "SO_LDTBXH"

DEPT_NAMES: Dict[str, str] = {d["code"]: d["name"] for d in CANONICAL_DEPARTMENTS}
DEPT_NAMES["SO_XAYDUNG"] = "Sở Xây dựng"
DEPT_NAMES["SO_YT"] = "Sở Y tế"

DEPT_HEADER_MAP = {
    "SO_GTVT": ("SỞ GIAO THÔNG VẬN TẢI TỈNH ĐỒNG NAI", "Số: .../TB-SGTVT"),
    "SO_TNMT": ("SỞ TÀI NGUYÊN VÀ MÔI TRƯỜNG TỈNH ĐỒNG NAI", "Số: .../TB-STNMT"),
    "SO_XD": ("SỞ XÂY DỰNG TỈNH ĐỒNG NAI", "Số: .../TB-SXD"),
    "SO_XAYDUNG": ("SỞ XÂY DỰNG TỈNH ĐỒNG NAI", "Số: .../TB-SXD"),
    "SO_YTE": ("SỞ Y TẾ TỈNH ĐỒNG NAI", "Số: .../TB-SYT"),
    "SO_YT": ("SỞ Y TẾ TỈNH ĐỒNG NAI", "Số: .../TB-SYT"),
    "SO_GDDT": ("SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI", "Số: .../TB-SGDDT"),
    "SO_LDTBXH": ("SỞ LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI TỈNH ĐỒNG NAI", "Số: .../TB-SLDTBXH"),
    "CONG_AN_TINH": ("CÔNG AN TỈNH ĐỒNG NAI", "Số: .../TB-CAT"),
    "UBND_TINH": ("ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI", "Số: .../TB-UBND"),
    "UBND_CAP_HUYEN": ("ỦY BAN NHÂN DÂN CẤP HUYỆN / TP", "Số: .../TB-UBND"),
    "REQUIRE_HUMAN_REVIEW": ("TỔ TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ TỈNH ĐỒNG NAI", "Số: .../TB-TĐP"),
}


def normalize_dept_code(code: Optional[str]) -> str:
    """Chuẩn hóa mã phòng ban về mã code canonical duy nhất."""
    if not code:
        return "REQUIRE_HUMAN_REVIEW"
    clean = code.strip().upper()
    return DEPT_ALIAS_MAP.get(clean, clean)


def get_department_name(code: Optional[str], fallback: Optional[str] = None) -> str:
    """Lấy tên tiếng Việt chuẩn của đơn vị."""
    norm = normalize_dept_code(code)
    dept = DEPARTMENT_MAP.get(norm)
    if dept:
        return dept["name"]
    return fallback or DEPT_NAMES.get(norm, code or "Chưa phân tuyến")


def get_canonical_departments(for_officer: bool = False) -> List[Dict[str, Any]]:
    """Trả về danh sách danh mục Sở/Ban/Ngành theo định dạng công khai {code, name, short_name, email}."""
    depts = CANONICAL_DEPARTMENTS
    if for_officer:
        depts = [d for d in depts if d.get("is_selectable_for_officer", False)]
    return [
        {
            "code": d["code"],
            "name": d["name"],
            "short_name": d["short_name"],
            "email": d["email"],
            "is_selectable_for_officer": d.get("is_selectable_for_officer", False),
        }
        for d in depts
    ]
