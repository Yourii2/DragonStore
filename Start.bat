@echo off
setlocal enabledelayedexpansion
title Dragon Store - Server Launcher

echo ===============================================================================
echo                DRAGON STORE FOR ELECTRONICS AND FREELANCE WORK
echo                       Dragon Security Systems Company
echo                          Eng. Mamdouh Elmasry
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
cd /d "%SCRIPT_DIR%"

:: Check if port 3000 is already in use
netstat -ano | findstr :3000 >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] A server process is already running on port 3000.
    echo Opening browser to http://localhost:3000...
    start "" "http://localhost:3000"
    goto :MONITOR
)

echo [1/3] Checking MySQL Service...
:: Test if MySQL is listening on port 3306
netstat -ano | findstr :3306 >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] MySQL service does not appear to be running on port 3306.
    echo Attempting to start XAMPP MySQL service...
    if exist "c:\xampp\mysql_start.bat" (
        call "c:\xampp\mysql_start.bat"
    ) else (
        echo Please ensure MySQL is started in XAMPP Control Panel.
    )
) else (
    echo [OK] MySQL Service is active and ready on port 3306.
)
echo.

echo [2/3] Starting Dragon Store Application Server...
echo Host URL: http://localhost:3000
echo.

:: Launch the Node.js development/production server in the background or new window
start "DragonStore Backend Engine" cmd /k "cd /d "%SCRIPT_DIR%" && npm run dev"

echo [3/3] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Opening default web browser...
start "" "http://localhost:3000"

:MONITOR
echo.
echo ===============================================================================
echo  Dragon Store is currently RUNNING at: http://localhost:3000
echo  To safely stop the application, run Stop.bat.
echo ===============================================================================
echo.
echo Press any key to minimize this window...
pause >nul
exit /b 0
