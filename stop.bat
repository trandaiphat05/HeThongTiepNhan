@echo off
chcp 65001 >nul
echo =====================================================================
echo  DUNG TOAN BO DICH VU HE THONG (BACKEND VA FRONTEND)
echo =====================================================================
echo.

echo [*] Dang dong cac tien trinh Backend (uvicorn.exe / python.exe)...
taskkill /F /IM uvicorn.exe /T 2>nul
taskkill /F /FI "WINDOWTITLE eq Backend FastAPI*" /T 2>nul

echo [*] Dang dong cac tien trinh Frontend (node.exe)...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /FI "WINDOWTITLE eq Frontend React*" /T 2>nul

echo.
echo =====================================================================
echo  Da tat toan bo tien trinh Backend va Frontend thanh cong!
echo =====================================================================
ping 127.0.0.1 -n 3 >nul
