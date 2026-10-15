@echo off
setlocal enabledelayedexpansion
title Dragon Store - Installation and Setup Wizard

echo ===============================================================================
echo                DRAGON STORE FOR ELECTRONICS AND FREELANCE WORK
echo                       Dragon Security Systems Company
echo                          Eng. Mamdouh Elmasry
echo ===============================================================================
echo.
echo [1/4] Checking prerequisites...

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js (v18 or higher) from https://nodejs.org
    echo After installing, restart this script.
    echo.
    pause
    exit /b 1
)

:: Check if NPM is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] NPM is not found in PATH!
    echo Please ensure NPM is properly installed.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js and NPM detected successfully.
echo.

:: Step 2: Install Dependencies
echo [2/4] Installing application dependencies...
echo Please wait, this may take a few moments...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm dependencies.
    echo Please check your internet connection or run 'npm install --legacy-peer-deps' manually.
    echo.
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully.
echo.

:: Step 3: Create Desktop Shortcut with Dragon Icon
echo [3/4] Creating Desktop Shortcut...
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

call node "%SCRIPT_DIR%\scripts\create-shortcut.js"
if %errorlevel% equ 0 (
    echo [OK] Desktop Shortcut created successfully with Dragon logo icon.
) else (
    echo [WARNING] Could not create Desktop shortcut automatically. You can launch using Start.bat.
)
echo.

:: Step 4: Verification and Launch Option
echo [4/4] Installation Complete!
echo ===============================================================================
echo  Application Name : Dragon Store for Electronics and Freelance Work
echo  Company          : Dragon Security Systems
echo  Lead Engineer    : Eng. Mamdouh Elmasry
echo  Contact Numbers  : 01150006289 (Phone / WhatsApp)
echo                   : 01050016289 (Phone / WhatsApp)
echo ===============================================================================
echo.
set /p LAUNCH_CHOICE="Do you want to start Dragon Store right now? (Y/N): "
if /i "%LAUNCH_CHOICE%"=="Y" (
    echo.
    echo Launching Dragon Store...
    start "" "%SCRIPT_DIR%\Start.bat"
) else (
    echo.
    echo You can start Dragon Store at any time using the Desktop shortcut or Start.bat.
)

echo.
echo Thank you for installing Dragon Store!
timeout /t 3 >nul
exit /b 0
