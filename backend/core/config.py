import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

# 1. Nạp triệt để file .env từ cả thư mục gốc và thư mục backend
root_env = os.path.join(ROOT_DIR, ".env")
backend_env = os.path.join(BASE_DIR, ".env")

if os.path.exists(root_env):
    load_dotenv(root_env, override=False)
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=True)
load_dotenv(override=False)

DOCS_DIR = os.path.join(BASE_DIR, "..", "docs")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "Hệ thống Điều phối Đơn thư AI - Tỉnh Đồng Nai"
    VERSION: str = "2.1.0"
    
    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        r"mssql+pyodbc://@localhost\SQLEXPRESS02/DongNaiCivicDB?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes"
    )
    DB_SERVER: str = os.getenv("DB_SERVER", r"localhost\SQLEXPRESS02")
    DB_NAME: str = os.getenv("DB_NAME", "DongNaiCivicDB")
    DB_USER: str = os.getenv("DB_USER", "sa")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "YourStrongPassword123!")
    DB_DRIVER: str = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    
    # Email Configuration (IMAP / SMTP Worker)
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", os.getenv("EMAIL_IMAP_SERVER", "imap.gmail.com"))
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", os.getenv("EMAIL_IMAP_PORT", 993)))
    MAIL_SMTP_SERVER: str = os.getenv("MAIL_SMTP_SERVER", os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com"))
    MAIL_SMTP_PORT: int = int(os.getenv("MAIL_SMTP_PORT", os.getenv("EMAIL_SMTP_PORT", 587)))
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", os.getenv("EMAIL_ACCOUNT", "your_email@gmail.com"))
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", os.getenv("EMAIL_PASSWORD", "your_app_password"))
    MAIL_SENDER_NAME: str = os.getenv("MAIL_SENDER_NAME", "Hệ thống Tiếp nhận Đơn thư Đồng Nai")
    MAIL_CHECK_INTERVAL_SECONDS: int = int(os.getenv("MAIL_CHECK_INTERVAL_SECONDS", os.getenv("EMAIL_CHECK_INTERVAL_SECONDS", 60)))

    # Legacy Aliases
    EMAIL_IMAP_SERVER: str = MAIL_SERVER
    EMAIL_IMAP_PORT: int = MAIL_PORT
    EMAIL_SMTP_SERVER: str = MAIL_SMTP_SERVER
    EMAIL_SMTP_PORT: int = MAIL_SMTP_PORT
    EMAIL_ACCOUNT: str = MAIL_USERNAME
    EMAIL_PASSWORD: str = MAIL_PASSWORD
    EMAIL_CHECK_INTERVAL_SECONDS: int = MAIL_CHECK_INTERVAL_SECONDS

settings = Settings()

