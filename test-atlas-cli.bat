@echo off
echo 🔌 Testing MongoDB Atlas CLI connection...
echo.

REM Try to find the Atlas CLI
set ATLAS_CLI_PATH=C:\mongodb-atlas-cli\bin\atlas.exe

if exist "%ATLAS_CLI_PATH%" (
    echo ✅ Found Atlas CLI at: %ATLAS_CLI_PATH%
    echo.
    echo 📡 Testing connection...
    
    REM Test connection using Atlas CLI
    "%ATLAS_CLI_PATH%" auth login --username joelamrom --password "Joel#2003"
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Authentication successful!
        echo.
        echo 📊 Testing database access...
        "%ATLAS_CLI_PATH%" db collections list --clusterName Cluster0Joel --dbName goldberger-family-db
    ) else (
        echo ❌ Authentication failed
    )
) else (
    echo ❌ Atlas CLI not found at: %ATLAS_CLI_PATH%
    echo.
    echo 💡 Please extract the MongoDB Atlas CLI files first:
    echo    1. Right-click mongodb-atlas-cli_1.43.0_windows_x86_64
    echo    2. Select "Extract All..."
    echo    3. Choose C:\mongodb-atlas-cli as destination
    echo    4. Run this script again
)

echo.
pause
