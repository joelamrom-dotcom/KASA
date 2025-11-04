@echo off
echo Starting AI SaaS Platform...
echo.

echo Installing dependencies...
npm install

echo.
echo Setting up environment...
if not exist .env.local (
    copy env.example .env.local
    echo Created .env.local file - please edit it with your configuration
    echo.
    pause
)

echo.
echo Starting development server...
npm run dev

pause
