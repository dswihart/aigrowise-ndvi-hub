# DigitalOcean Spaces Setup Script (PowerShell)
Write-Host ""
Write-Host "🔧 DigitalOcean Spaces Credentials Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Check if env.production exists
$envFile = "env.production"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: env.production file not found in project root!" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "Please ensure you're running this from the bmad-aigrowise\scripts directory" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found env.production file" -ForegroundColor Green
Write-Host ""

# Create backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "env.production.backup.$timestamp"

Write-Host "💾 Creating backup..." -ForegroundColor Yellow
Copy-Item $envFile $backupFile
Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
Write-Host ""

# Get credentials
Write-Host "🔑 Please enter your DigitalOcean Spaces credentials:" -ForegroundColor Cyan
Write-Host ""

$accessKey = Read-Host "Access Key ID"
if (-not $accessKey) {
    Write-Host "❌ Access Key ID cannot be empty" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$secretKey = Read-Host "Secret Access Key" -AsSecureString
$secretKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey))

if (-not $secretKeyPlain) {
    Write-Host "❌ Secret Access Key cannot be empty" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
$bucketName = Read-Host "Bucket Name (default: aigrowise-ndvi-images)"
if (-not $bucketName) { $bucketName = "aigrowise-ndvi-images" }

$region = Read-Host "Region (default: nyc3)"
if (-not $region) { $region = "nyc3" }

$endpoint = Read-Host "Endpoint (default: https://nyc3.digitaloceanspaces.com)"
if (-not $endpoint) { $endpoint = "https://nyc3.digitaloceanspaces.com" }

Write-Host ""
Write-Host "📝 Updating credentials in env.production..." -ForegroundColor Yellow

# Read current content
$content = Get-Content $envFile

# Update each credential
$content = $content -replace 'DO_SPACES_ACCESS_KEY=".*"', "DO_SPACES_ACCESS_KEY=`"$accessKey`""
$content = $content -replace 'DO_SPACES_SECRET_KEY=".*"', "DO_SPACES_SECRET_KEY=`"$secretKeyPlain`""
$content = $content -replace 'DO_SPACES_BUCKET=".*"', "DO_SPACES_BUCKET=`"$bucketName`""
$content = $content -replace 'DO_SPACES_REGION=".*"', "DO_SPACES_REGION=`"$region`""
$content = $content -replace 'DO_SPACES_ENDPOINT=".*"', "DO_SPACES_ENDPOINT=`"$endpoint`""

# Write back to file
$content | Set-Content $envFile

Write-Host "✅ Credentials updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Updated configuration:" -ForegroundColor Cyan
Write-Host "  Access Key: $accessKey" -ForegroundColor White
Write-Host "  Bucket: $bucketName" -ForegroundColor White
Write-Host "  Region: $region" -ForegroundColor White
Write-Host "  Endpoint: $endpoint" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test the connection: node scripts\test-spaces-connection.js" -ForegroundColor White
Write-Host "  2. If successful, restart your application" -ForegroundColor White
Write-Host "  3. Test image upload functionality" -ForegroundColor White
Write-Host ""
Write-Host "📁 Backup location: $backupFile" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"