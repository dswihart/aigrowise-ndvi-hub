@echo off
setlocal enabledelayedexpansion

echo 🔧 Quick fix for login issues...

REM Check if .env exists
if not exist ".env" (
    echo .env file not found. Creating one...
    
    REM Prompt for database info
    set /p DB_HOST="Database Host: "
    set /p DB_PORT="Database Port [5432]: "
    if "!DB_PORT!"=="" set DB_PORT=5432
    set /p DB_NAME="Database Name: "
    set /p DB_USER="Database User: "
    set /p DB_PASSWORD="Database Password: "
    
    REM Create .env file
    (
        echo # Production Environment Variables
        echo NODE_ENV=production
        echo PORT=3000
        echo.
        echo # Database Configuration
        echo DATABASE_URL="postgresql://!DB_USER!:!DB_PASSWORD!@!DB_HOST!:!DB_PORT!/!DB_NAME!"
        echo.
        echo # Next.js Authentication
        echo NEXTAUTH_SECRET="generate-this-with-openssl-rand-base64-32"
        echo NEXTAUTH_URL="https://dashboard.aigrowise.com"
    ) > .env
    
    echo .env file created successfully.
    echo.
    echo IMPORTANT: You need to manually set NEXTAUTH_SECRET in the .env file.
    echo Run this command to generate a secret: openssl rand -base64 32
    echo.
) else (
    echo .env file already exists.
)

echo.
echo Please run the following commands on your production server:
echo.
echo 1. Copy these files to your server: /opt/aigrowise/
echo 2. Run: chmod +x *.sh
echo 3. Run: ./quick-fix-login.sh
echo.
echo Or manually:
echo 1. Create .env file with proper values
echo 2. Restart docker-compose
echo 3. Test database connection
echo.
pause
