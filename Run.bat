@echo off
title Minal AI - Pure React Studio & Web
cd /d "%~dp0"

echo ==========================================================
echo       MINAL AI - PURE REACT + VITE PACKAGING STUDIO
echo ==========================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js from https://nodejs.org and try again.
    echo.
    pause
    exit /b 1
)

:: 2. Free port 3000 if an orphaned process is still holding it
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [INFO] Freeing port 3000 held by previous process %%a...
    taskkill /f /pid %%a >nul 2>nul
)

:: 3. Automatically open browser preview
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: 4. Launch Vite server (instant startup ~100ms)
echo.
echo ==========================================================
echo   Vite Engine ready at: http://localhost:3000
echo   Opening browser preview automatically...
echo   (Press Ctrl+C to stop the server at any time)
echo ==========================================================
echo.

call npm.cmd run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server stopped with an error code.
    pause
)
