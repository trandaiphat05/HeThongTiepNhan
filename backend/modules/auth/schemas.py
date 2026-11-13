"""
Pydantic Schemas cho Module Xác thực & Quản lý Người dùng (Auth)
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., description="Tên đăng nhập")
    password: str = Field(..., description="Mật khẩu")


class UserInfo(BaseModel):
    user_id: int
    username: str
    full_name: str
    role: str
    department_code: Optional[str] = None
    dept_code: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    officer_code: Optional[str] = None
    is_active: bool = True
    gmail_account: Optional[str] = None
    last_synced_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Tên đăng nhập")
    password: str = Field(..., min_length=6, max_length=100, description="Mật khẩu tối thiểu 6 ký tự")
    full_name: str = Field(..., min_length=2, max_length=100, description="Họ và tên đầy đủ")
    email: Optional[str] = Field(None, max_length=100, description="Địa chỉ email liên hệ hoặc email công vụ")
    phone: Optional[str] = Field(None, max_length=20, description="Số điện thoại liên hệ")
    role: str = Field("CITIZEN", description="Vai trò: CITIZEN hoặc OFFICER")
    dept_code: Optional[str] = Field(None, description="Mã phòng ban nếu là cán bộ")
    officer_code: Optional[str] = Field(None, description="Mã số cán bộ nếu là cán bộ")


class RegisterResponse(BaseModel):
    success: bool
    message: str
    user: UserInfo


class LinkGmailRequest(BaseModel):
    gmail_account: str = Field(..., description="Tài khoản Gmail cá nhân/công vụ")
    gmail_app_password: str = Field(..., min_length=8, description="Mật khẩu ứng dụng 16 ký tự Google App Password")


class GmailStatusResponse(BaseModel):
    is_linked: bool
    gmail_account: Optional[str] = None
    last_synced_at: Optional[str] = None


class SyncGmailRequest(BaseModel):
    gmail_account: Optional[str] = Field(None, description="Tài khoản Gmail tùy chọn")
    gmail_app_password: Optional[str] = Field(None, description="Mật khẩu ứng dụng tùy chọn")
    max_emails: Optional[int] = Field(5, description="Số lượng thư tối đa đồng bộ mỗi lượt")


class UserCreateRequest(BaseModel):
    full_name: str = Field(..., description="Họ và tên cán bộ")
    username: str = Field(..., description="Tên đăng nhập hệ thống")
    role: str = Field("OFFICER", description="Vai trò: ADMIN, OFFICER, ONE_STOP, CITIZEN")
    dept_code: Optional[str] = Field("UBND_CAP_HUYEN", description="Mã phòng ban trực thuộc")


class UserResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    role: str
    dept_code: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
