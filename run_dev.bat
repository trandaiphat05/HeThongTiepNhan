@echo off
chcp 65001 >nul
title KHOI DONG HE THONG DIEU PHOI DON THU AI - DONG NAI
echo ===================================================================
echo   HỆ THỐNG ĐIỀU PHỐI ĐƠN THƯ AI - TỈNH ĐỒNG NAI
echo ===================================================================
echo.

:: Giải phóng cổng nếu đang bị kẹt
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)

echo [1/2] Đang khởi động Backend FastAPI (Cổng 8000)...
start "Backend FastAPI" cmd /k "cd /d %~dp0backend && \"%~dp0backend\venv\Scripts\python.exe\" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

ping 127.0.0.1 -n 4 >nul

echo [2/2] Đang khởi động Frontend React Vite (Cổng 5173)...
start "Frontend React" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================================
echo ✓ Cả hai phân hệ đã được khởi chạy trong 2 cửa sổ riêng biệt!
echo.
echo - Frontend:  http://localhost:5173
echo - Backend:   http://127.0.0.1:8000
echo - Swagger:   http://127.0.0.1:8000/docs
echo ===================================================================
echo.
pause
