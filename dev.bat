@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================
echo   FlashCard - dev mode (HMR)
echo ================================
echo.
call npm run tauri:dev
pause
