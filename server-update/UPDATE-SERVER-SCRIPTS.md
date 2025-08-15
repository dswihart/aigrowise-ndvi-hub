# 🔄 Server Scripts Update Guide

## Upload Updated Scripts to Production Server

### Step 1: Upload Files to Server

From your local machine, upload the updated files:

```bash
# Upload the server-update directory
scp -r server-update/ root@dashboard.aigrowise.com:/tmp/

# SSH to server
ssh root@dashboard.aigrowise.com
```

### Step 2: Update Scripts on Server

```bash
# Navigate to application directory
cd /var/www/bmad-aigrowise

# Backup current scripts
cp -r scripts scripts.backup.$(date +%Y%m%d_%H%M%S)

# Copy new scripts
cp -r /tmp/server-update/scripts/* scripts/

# Update environment file if needed
cp /tmp/server-update/env.production ./env.production

# Copy new documentation
cp /tmp/server-update/DIGITALOCEAN-SPACES-LINUX-SETUP.md ./

# Make all scripts executable
chmod +x scripts/*.sh

# Clean up temp files
rm -rf /tmp/server-update
```

### Step 3: Test Updated Scripts

```bash
# Test the credentials update script
cd /var/www/bmad-aigrowise/scripts
./update-spaces-credentials.sh

# Test connection script (after configuring credentials)
cd /var/www/bmad-aigrowise
node scripts/test-spaces-connection.js

# Run full deployment verification
cd /var/www/bmad-aigrowise/scripts
./verify-full-deployment.sh
```

### Step 4: Configure DigitalOcean Spaces

Follow the setup guide:
```bash
cat /var/www/bmad-aigrowise/DIGITALOCEAN-SPACES-LINUX-SETUP.md
```

The key steps are:
1. Create DigitalOcean Spaces bucket: `aigrowise-ndvi-images`
2. Generate API keys 
3. Run: `./scripts/update-spaces-credentials.sh`
4. Test: `node scripts/test-spaces-connection.js`
5. Restart app: `pm2 restart aigrowise-ndvi-hub`

## Updated Files

- `scripts/update-spaces-credentials.sh` - Linux credential configuration
- `scripts/test-spaces-connection.js` - Enhanced connection testing  
- `scripts/verify-full-deployment.sh` - Complete deployment verification
- `DIGITALOCEAN-SPACES-LINUX-SETUP.md` - Linux-specific setup guide
- `env.production` - Updated environment template

## Success Indicators

✅ Scripts are executable (`ls -la scripts/`)  
✅ Credentials update script runs without errors  
✅ Connection test passes all 4 checks  
✅ Full verification script shows mostly green  
✅ Application restarts successfully with PM2  
✅ Image upload works in web interface  

Your server is now ready for DigitalOcean Spaces! 🚀