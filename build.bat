@echo off
cd /d "%~dp0"
echo ================================
echo   FlashCard - 打包 Portable EXE
echo ================================
echo.
call npm run tauri:build
if %errorlevel% neq 0 (
    echo.
    echo 打包失敗！
    pause
    exit /b %errorlevel%
)
if not exist "portable\FlashCard" mkdir "portable\FlashCard"
copy /y "src-tauri\target\release\app.exe" "portable\FlashCard\FlashCard.exe"
echo.
echo ================================
echo   打包完成！
echo   輸出位置: portable\FlashCard\FlashCard.exe
echo ================================
pause
