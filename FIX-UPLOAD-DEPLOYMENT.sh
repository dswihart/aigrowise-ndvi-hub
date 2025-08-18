#!/bin/bash

# 🚀 AIGROWISE NDVI HUB - File Upload Fix Deployment Script
# This script fixes the file upload functionality and deploys to production

echo "🌱 Aigrowise NDVI Hub - File Upload Fix Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root or with sudo"
    exit 1
fi

# Set working directory
WORK_DIR="/opt/aigrowise"
if [ ! -d "$WORK_DIR" ]; then
    print_error "Directory $WORK_DIR does not exist. Please check the path."
    exit 1
fi

cd "$WORK_DIR" || exit 1
print_success "Changed to working directory: $WORK_DIR"

# Step 1: Check current status
print_step "Checking current application status..."
pm2 status aigrowise-ndvi-hub || print_warning "PM2 process not found"

# Step 2: Update package.json if needed
print_step "Checking package.json dependencies..."
if ! grep -q "formidable" package.json; then
    print_warning "Adding missing formidable dependency..."
    npm install formidable@latest @types/formidable@latest
fi

# Step 3: Install/update dependencies
print_step "Installing/updating dependencies..."
npm install

# Step 4: Check environment variables
print_step "Checking DigitalOcean Spaces configuration..."
if [ -f ".env.production" ]; then
    if grep -q "DO_SPACES_ACCESS_KEY=" .env.production && grep -q "DO_SPACES_SECRET_KEY=" .env.production; then
        DO_ACCESS_KEY=$(grep "DO_SPACES_ACCESS_KEY=" .env.production | cut -d '=' -f2 | tr -d '"')
        DO_SECRET_KEY=$(grep "DO_SPACES_SECRET_KEY=" .env.production | cut -d '=' -f2 | tr -d '"')
        
        if [ -z "$DO_ACCESS_KEY" ] || [ -z "$DO_SECRET_KEY" ] || [ "$DO_ACCESS_KEY" = "your-actual-access-key-here" ]; then
            print_error "DigitalOcean Spaces credentials are not configured!"
            print_warning "Please update .env.production with your actual DigitalOcean Spaces credentials:"
            echo ""
            echo "DO_SPACES_ACCESS_KEY=\"your-spaces-access-key\""
            echo "DO_SPACES_SECRET_KEY=\"your-spaces-secret-key\""
            echo "DO_SPACES_BUCKET=\"aigrowise-ndvi-images\""
            echo "DO_SPACES_ENDPOINT=\"https://nyc3.digitaloceanspaces.com\""
            echo "DO_SPACES_REGION=\"nyc3\""
            echo ""
            print_warning "Would you like to configure them now? (y/N)"
            read -r configure_spaces
            if [[ $configure_spaces =~ ^[Yy]$ ]]; then
                echo "Enter your DigitalOcean Spaces Access Key:"
                read -r spaces_access_key
                echo "Enter your DigitalOcean Spaces Secret Key:"
                read -r spaces_secret_key
                
                # Update environment file
                sed -i "s/DO_SPACES_ACCESS_KEY=.*/DO_SPACES_ACCESS_KEY=\"$spaces_access_key\"/" .env.production
                sed -i "s/DO_SPACES_SECRET_KEY=.*/DO_SPACES_SECRET_KEY=\"$spaces_secret_key\"/" .env.production
                print_success "DigitalOcean Spaces credentials updated"
            else
                print_warning "Continuing without updating credentials. Upload functionality may not work."
            fi
        else
            print_success "DigitalOcean Spaces credentials are configured"
        fi
    else
        print_error "DigitalOcean Spaces configuration missing from .env.production"
        echo ""
        echo "Please add the following to .env.production:"
        echo "DO_SPACES_ACCESS_KEY=\"your-spaces-access-key\""
        echo "DO_SPACES_SECRET_KEY=\"your-spaces-secret-key\""
        echo "DO_SPACES_BUCKET=\"aigrowise-ndvi-images\""
        echo "DO_SPACES_ENDPOINT=\"https://nyc3.digitaloceanspaces.com\""
        echo "DO_SPACES_REGION=\"nyc3\""
    fi
else
    print_error ".env.production file not found!"
    exit 1
fi

# Step 5: Test DigitalOcean Spaces connection
print_step "Testing DigitalOcean Spaces connection..."
cat > test-spaces-connection.js << 'EOF'
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.production' });

async function testConnection() {
  try {
    const client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: process.env.DO_SPACES_REGION,
      credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET_KEY
      }
    });

    await client.send(new ListBucketsCommand({}));
    console.log('✅ DigitalOcean Spaces connection successful');
    process.exit(0);
  } catch (error) {
    console.error('❌ DigitalOcean Spaces connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
EOF

if node test-spaces-connection.js; then
    print_success "DigitalOcean Spaces connection test passed"
else
    print_error "DigitalOcean Spaces connection test failed"
    print_warning "Upload functionality will not work until Spaces is properly configured"
fi

# Clean up test file
rm -f test-spaces-connection.js

# Step 6: Build the application
print_step "Building the application..."
if npm run build; then
    print_success "Application built successfully"
else
    print_error "Build failed!"
    exit 1
fi

# Step 7: Update PM2 configuration
print_step "Updating PM2 configuration..."
if [ -f "config/ecosystem.config.js" ]; then
    # Check if the config includes environment variables
    if ! grep -q "env_file" config/ecosystem.config.js; then
        print_warning "Adding environment file to PM2 configuration..."
        # Backup original config
        cp config/ecosystem.config.js config/ecosystem.config.js.backup
        
        # Update the config to include environment file
        cat > config/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'aigrowise-ndvi-hub',
    script: 'server.js',
    cwd: '/opt/aigrowise',
    instances: 1,
    exec_mode: 'cluster',
    env_file: '.env.production',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF
        print_success "PM2 configuration updated"
    fi
else
    print_error "PM2 configuration file not found at config/ecosystem.config.js"
    exit 1
fi

# Step 8: Restart PM2 with updated environment
print_step "Restarting PM2 with updated environment..."
pm2 delete aigrowise-ndvi-hub 2>/dev/null || true
sleep 2

if pm2 start config/ecosystem.config.js; then
    print_success "PM2 started successfully"
else
    print_error "Failed to start PM2"
    exit 1
fi

# Wait for application to start
print_step "Waiting for application to start..."
sleep 5

# Step 9: Check PM2 status
print_step "Checking PM2 status..."
pm2 status aigrowise-ndvi-hub

# Step 10: Test health endpoint
print_step "Testing health endpoint..."
sleep 2
if curl -s -f https://dashboard.aigrowise.com/api/health > /dev/null; then
    print_success "Health endpoint is responding"
else
    print_warning "Health endpoint is not responding yet. This may be normal during startup."
fi

# Step 11: Check application logs
print_step "Checking recent application logs..."
pm2 logs aigrowise-ndvi-hub --lines 10 --nostream

# Step 12: Update Nginx configuration if needed
print_step "Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/aigrowise-ndvi-hub" ]; then
    if ! grep -q "client_max_body_size" /etc/nginx/sites-available/aigrowise-ndvi-hub; then
        print_warning "Adding file upload size limit to Nginx configuration..."
        
        # Backup Nginx config
        cp /etc/nginx/sites-available/aigrowise-ndvi-hub /etc/nginx/sites-available/aigrowise-ndvi-hub.backup
        
        # Add client_max_body_size to server block
        sed -i '/server {/a\    client_max_body_size 50M;' /etc/nginx/sites-available/aigrowise-ndvi-hub
        
        # Test Nginx configuration
        if nginx -t; then
            systemctl reload nginx
            print_success "Nginx configuration updated and reloaded"
        else
            print_error "Nginx configuration test failed. Restoring backup."
            cp /etc/nginx/sites-available/aigrowise-ndvi-hub.backup /etc/nginx/sites-available/aigrowise-ndvi-hub
        fi
    else
        print_success "Nginx already configured for file uploads"
    fi
else
    print_warning "Nginx configuration file not found. This may be normal if using a different web server."
fi

# Step 13: Save PM2 configuration
print_step "Saving PM2 configuration..."
pm2 save

# Final status check
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""

print_step "Final Status Check:"

# Check PM2 status
if pm2 status aigrowise-ndvi-hub | grep -q "online"; then
    print_success "PM2 process is running"
else
    print_error "PM2 process is not running properly"
fi

# Check if port 3000 is listening
if netstat -tlnp | grep -q ":3000"; then
    print_success "Application is listening on port 3000"
else
    print_error "Application is not listening on port 3000"
fi

# Final health check
sleep 2
if curl -s -f https://dashboard.aigrowise.com/api/health > /dev/null; then
    print_success "Application is responding to health checks"
else
    print_warning "Application health check failed"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Test file upload functionality at: https://dashboard.aigrowise.com"
echo "2. Login as admin and try uploading an image"
echo "3. Check browser console (F12) for any errors"
echo "4. Monitor logs with: pm2 logs aigrowise-ndvi-hub"
echo ""

print_step "To test upload manually:"
echo "1. Go to https://dashboard.aigrowise.com"
echo "2. Login as admin (admin@aigrowise.com)"
echo "3. Create or select a client"
echo "4. Upload a test NDVI image (TIFF, PNG, or JPEG)"
echo "5. Verify the image appears in the client's dashboard"
echo ""

if [ -z "$DO_ACCESS_KEY" ] || [ "$DO_ACCESS_KEY" = "your-actual-access-key-here" ]; then
    print_warning "IMPORTANT: File uploads will not work until you configure DigitalOcean Spaces credentials!"
    echo "Please update .env.production with your actual credentials and restart PM2."
fi

print_success "File upload fix deployment completed!"