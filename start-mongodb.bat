@echo off
echo ========================================
echo Goldberger Family Dashboard - MongoDB
echo ========================================
echo.

echo Checking if MongoDB is running...
net start MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo MongoDB is not running. Starting MongoDB...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo ERROR: Could not start MongoDB. Please install MongoDB first.
        echo Visit: https://www.mongodb.com/try/download/community
        pause
        exit /b 1
    )
) else (
    echo MongoDB is already running.
)

echo.
echo Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies. Please check your Node.js installation.
    pause
    exit /b 1
)

echo.
echo Starting the server...
echo The dashboard will be available at: http://localhost:3000
echo.
echo Default login credentials:
echo - Super Admin: test@example.com / admin123
echo - Admin: admin@example.com / admin456
echo - Member: test@gmail.com / member123
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause
