@echo off
cd /d "%~dp0"
echo ================================
echo   FlashCard - 開發模式 (HMR)
echo ================================
echo.
call npm run tauri:dev
pause
