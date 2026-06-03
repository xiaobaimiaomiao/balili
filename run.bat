@echo off
setlocal

echo ========================================
echo   Balili - Build and Run
echo ========================================
echo.

:: Step 1: Build server.exe
echo [1/3] Building server.exe...
go build -o bin\server.exe .\cmd\server\main.go
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo       Build OK
echo.

:: Step 2: Copy to F:\bd
echo [2/3] Copying to F:\bd...
if not exist F:\bd mkdir F:\bd
copy /y bin\server.exe F:\bd\server.exe >nul
if %errorlevel% neq 0 (
    echo ERROR: Copy failed!
    pause
    exit /b 1
)
echo       Copied to F:\bd\server.exe
echo.

:: Step 3: Run
echo [3/3] Starting server on F:\bd...
echo ========================================
echo.
cd /d F:\bd
server.exe --port 8080 --db "%~dp0data\balili.db"
