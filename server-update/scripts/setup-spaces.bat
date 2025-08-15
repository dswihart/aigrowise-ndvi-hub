@echo off
echo.
echo 🔧 DigitalOcean Spaces Credentials Setup
echo ========================================
echo.

REM Navigate to project root
cd /d "%~dp0.."

REM Check if env.production exists
if not exist "env.production" (
    echo ❌ Error: env.production file not found in project root!
    echo Current directory: %CD%
    echo Please ensure you're running this from the bmad-aigrowise\scripts directory
    pause
    exit /b 1
)

echo ✅ Found env.production file
echo.

REM Create backup
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=env.production.backup.%TIMESTAMP%

echo 💾 Creating backup...
copy "env.production" "%BACKUP_FILE%" >nul
echo ✅ Backup created: %BACKUP_FILE%
echo.

REM Get credentials
echo 🔑 Please enter your DigitalOcean Spaces credentials:
echo.

set /p ACCESS_KEY="Access Key ID: "
if "%ACCESS_KEY%"=="" (
    echo ❌ Access Key ID cannot be empty
    pause
    exit /b 1
)

echo.
echo Enter Secret Access Key (input will be hidden):
powershell -Command "$pwd = Read-Host -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwd))" > temp_secret.txt
set /p SECRET_KEY=<temp_secret.txt
del temp_secret.txt

if "%SECRET_KEY%"=="" (
    echo ❌ Secret Access Key cannot be empty
    pause
    exit /b 1
)

echo.
set /p BUCKET_NAME="Bucket Name (default: aigrowise-ndvi-images): "
if "%BUCKET_NAME%"=="" set BUCKET_NAME=aigrowise-ndvi-images

set /p REGION="Region (default: nyc3): "
if "%REGION%"=="" set REGION=nyc3

set /p ENDPOINT="Endpoint (default: https://nyc3.digitaloceanspaces.com): "
if "%ENDPOINT%"=="" set ENDPOINT=https://nyc3.digitaloceanspaces.com

echo.
echo 📝 Updating credentials in env.production...

REM Update the environment file using PowerShell
powershell -Command "(Get-Content 'env.production') -replace 'DO_SPACES_ACCESS_KEY=\".*\"', 'DO_SPACES_ACCESS_KEY=\"%ACCESS_KEY%\"' | Set-Content 'env.production'"
powershell -Command "(Get-Content 'env.production') -replace 'DO_SPACES_SECRET_KEY=\".*\"', 'DO_SPACES_SECRET_KEY=\"%SECRET_KEY%\"' | Set-Content 'env.production'"
powershell -Command "(Get-Content 'env.production') -replace 'DO_SPACES_BUCKET=\".*\"', 'DO_SPACES_BUCKET=\"%BUCKET_NAME%\"' | Set-Content 'env.production'"
powershell -Command "(Get-Content 'env.production') -replace 'DO_SPACES_REGION=\".*\"', 'DO_SPACES_REGION=\"%REGION%\"' | Set-Content 'env.production'"
powershell -Command "(Get-Content 'env.production') -replace 'DO_SPACES_ENDPOINT=\".*\"', 'DO_SPACES_ENDPOINT=\"%ENDPOINT%\"' | Set-Content 'env.production'"

echo ✅ Credentials updated successfully!
echo.
echo 🔍 Updated configuration:
echo   Access Key: %ACCESS_KEY%
echo   Bucket: %BUCKET_NAME%
echo   Region: %REGION%
echo   Endpoint: %ENDPOINT%
echo.
echo 🧪 Next steps:
echo   1. Test the connection: node scripts\test-spaces-connection.js
echo   2. If successful, restart your application
echo   3. Test image upload functionality
echo.
echo 📁 Backup location: %BACKUP_FILE%
echo.
echo Press any key to continue...
pause >nul