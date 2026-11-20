@echo off
chcp 65001 >nul
echo =====================================================================
echo  DỪNG TOÀN BỘ TIẾN TRÌNH HỆ THỐNG (BACKEND VÀ FRONTEND)
echo =====================================================================
echo.

echo [*] Đang giải phóng cổng 8000 (Backend) và cổng 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)

echo [*] Đang đóng các cửa sổ dòng lệnh Backend và Frontend...
taskkill /F /FI "WINDOWTITLE eq Backend FastAPI*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend React*" /T >nul 2>&1

echo.
echo =====================================================================
echo  ✓ Đã tắt toàn bộ tiến trình Backend và Frontend thành công!
echo =====================================================================
ping 127.0.0.1 -n 2 >nul
