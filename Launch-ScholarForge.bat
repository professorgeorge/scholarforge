@echo off
title ScholarForge Launcher
cd /d "%~dp0"

echo Checking if ScholarForge is already running on port 5173...
netstat -ano | findstr /R /C:":5173 " >nul
if %errorlevel% equ 0 (
    echo ScholarForge is already running!
    echo Opening http://localhost:5173 in your default browser...
    start http://localhost:5173
    exit /b 0
)

echo Starting ScholarForge local development server...
start /b cmd /c "npm run dev > nul 2>&1"

:: Wait up to 5 seconds for Vite to bind port 5173
set count=0
:wait_loop
timeout /t 1 /nobreak >nul
netstat -ano | findstr /R /C:":5173 " >nul
if %errorlevel% equ 0 goto launched
set /a count+=1
if %count% lss 6 goto wait_loop

:launched
echo Opening http://localhost:5173...
start http://localhost:5173
echo ScholarForge is now active at http://localhost:5173!
exit /b 0
