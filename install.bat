@echo off
setlocal enabledelayedexpansion
title Dragon Store - Installation and Setup Wizard

:: Set and change current working directory to project directory
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
cd /d "%SCRIPT_DIR%"

echo ===============================================================================
echo                DRAGON STORE FOR ELECTRONICS AND FREELANCE WORK
echo                       Dragon Security Systems Company
echo                          Eng. Mamdouh Elmasry
echo ===============================================================================
echo.
echo [1/4] Checking prerequisites...

:: Ensure Node is in PATH
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
)

where node >nul 2>nul
if %errorlevel% neq 0 goto :NO_NODE

where npm >nul 2>nul
if %errorlevel% neq 0 goto :NO_NPM

for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
for /f "tokens=*" %%v in ('npm -v') do set "NPM_VER=%%v"
echo [OK] Node.js !NODE_VER! and NPM !NPM_VER! detected successfully.
echo.
goto :INSTALL_DEPS

:NO_NODE
echo [ERROR] Node.js is not found in PATH!
echo Please install Node.js from https://nodejs.org
echo After installing, restart this script.
echo.
pause
exit /b 1

:NO_NPM
echo [ERROR] NPM is not found in PATH!
echo Please ensure Node.js and NPM are properly installed.
echo.
pause
exit /b 1

:INSTALL_DEPS
echo [2/4] Installing application dependencies...
echo Please wait, this may take a few moments...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install npm dependencies.
    echo Retrying with --force...
    call npm install --force
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install dependencies.
        echo Please check your internet connection or run npm install manually.
        echo.
        pause
        exit /b 1
    )
)
echo [OK] Dependencies installed successfully.
echo.

echo [3/4] Creating Desktop Shortcut...
if exist "%SCRIPT_DIR%\scripts\create-shortcut.js" (
    call node "%SCRIPT_DIR%\scripts\create-shortcut.js"
    if !errorlevel! equ 0 (
        echo [OK] Desktop Shortcut created successfully with Dragon logo icon.
    ) else (
        echo [WARNING] Could not create Desktop shortcut automatically.
    )
)
echo.

echo [4/4] Installation Complete!
echo ===============================================================================
echo  Application Name : Dragon Store for Electronics and Freelance Work
echo  Company          : Dragon Security Systems
echo  Lead Engineer    : Eng. Mamdouh Elmasry
echo  Contact Numbers  : 01150006289 - 01050016289
echo ===============================================================================
echo.
set "LAUNCH_CHOICE=Y"
set /p LAUNCH_CHOICE="Do you want to start Dragon Store right now? [Y/N] [Default: Y]: "
if /i "!LAUNCH_CHOICE!"=="Y" (
    echo.
    echo Launching Dragon Store...
    start "" "%SCRIPT_DIR%\Start.bat"
) else (
    echo.
    echo You can start Dragon Store at any time using Desktop shortcut or Start.bat.
)

echo.
echo Thank you for installing Dragon Store!
ping -n 3 127.0.0.1 >nul 2>nul
exit /b 0
