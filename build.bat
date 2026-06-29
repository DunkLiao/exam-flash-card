@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================
echo   FlashCard - build portable EXE
echo ================================
echo.
call npm run tauri:build
if %errorlevel% neq 0 (
    echo.
    echo Build failed!
    pause
    exit /b %errorlevel%
)
if not exist "portable\FlashCard" mkdir "portable\FlashCard"
copy /y "src-tauri\target\release\app.exe" "portable\FlashCard\FlashCard.exe"
echo.
echo ================================
echo   Build done!
echo   Output: portable\FlashCard\FlashCard.exe
echo ================================
pause
