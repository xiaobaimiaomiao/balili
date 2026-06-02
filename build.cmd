@echo off
setlocal

echo ========================================
echo   Balili Build Script
echo ========================================
echo.

:: Create output directory
if not exist bin mkdir bin

:: Build Go server
echo [1/3] Building Go server...
go build -o bin\server.exe .\cmd\server\main.go
if %errorlevel% neq 0 (
    echo ERROR: Server build failed!
    exit /b 1
)
echo       OK: bin\server.exe
echo.

:: Build Go import tool
echo [2/3] Building import tool...
go build -o bin\import.exe .\cmd\import\main.go
if %errorlevel% neq 0 (
    echo ERROR: Import build failed!
    exit /b 1
)
echo       OK: bin\import.exe
echo.

:: Build Next.js frontend
echo [3/3] Building Next.js frontend...
cd web
call npm run build
if %errorlevel% neq 0 (
    cd ..
    echo ERROR: Frontend build failed!
    exit /b 1
)
cd ..
echo       OK: web\.next
echo.

echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo   bin\server.exe   - API Server
echo   bin\import.exe   - Data Import Tool
echo   web\.next\       - Frontend Build
echo.
echo   Run server:  bin\server.exe --port 8080
echo   Run import:  bin\import.exe --dir ./parsed-json --db ./data/balili.db
echo.
pause
