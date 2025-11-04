@echo off
echo ========================================
echo Goldberger Family Dashboard Launcher
echo ========================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking if MongoDB is running...
netstat -an | findstr :27017 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB doesn't appear to be running on port 27017
    echo Attempting to start MongoDB service...
    net start MongoDB >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Could not start MongoDB service
        echo Please ensure MongoDB is installed and configured
        pause
        exit /b 1
    )
    echo MongoDB service started successfully
) else (
    echo MongoDB is already running
)

echo.
echo Installing dependencies...
npm install

echo.
echo Starting the dashboard server...
echo Dashboard will be available at: http://localhost:3000/goldberger-family-fast.html
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
