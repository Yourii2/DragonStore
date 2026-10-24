@echo off
setlocal enabledelayedexpansion
title Dragon Store - Server Stopper

echo ===============================================================================
echo                DRAGON STORE FOR ELECTRONICS AND FREELANCE WORK
echo                       Dragon Security Systems Company
echo                          Eng. Mamdouh Elmasry
echo ===============================================================================
echo.
echo Stopping Dragon Store server processes...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    set PID=%%a
    if defined PID (
        echo [INFO] Found process listening on port 3000 with PID: !PID!
        taskkill /F /PID !PID! >nul 2>nul
        if !errorlevel! equ 0 (
            echo [OK] Successfully stopped process !PID!.
        )
    )
)

taskkill /F /FI "WINDOWTITLE eq DragonStore Backend Engine*" >nul 2>nul

netstat -ano | findstr :3000 | findstr LISTENING >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [SUCCESS] Dragon Store application has been completely stopped.
) else (
    echo.
    echo [WARNING] Port 3000 might still have an active process.
)

echo.
echo ===============================================================================
echo  Dragon Store Server has been terminated cleanly.
echo ===============================================================================
echo.
timeout /t 3 >nul
exit /b 0
