# 🚀 DigitalOcean Spaces Setup for Linux Server

## 📋 Quick Setup for dashboard.aigrowise.com

Your system is **production-ready** and just needs DigitalOcean Spaces credentials configured.

## 🎯 5-Minute Setup Process

### Step 1: Create DigitalOcean Spaces Bucket (2 minutes)

1. Go to [DigitalOcean Spaces Console](https://cloud.digitalocean.com/spaces)
2. Click **"Create a Space"**
3. Configure:
   - **Name**: `aigrowise-ndvi-images`
   - **Region**: NYC3 (matches your current config)
   - **File Listing**: Enable
   - **CDN**: Enable (recommended for faster loading)
4. Click **"Create a Space"**

### Step 2: Generate API Keys (1 minute)

1. Go to **API** → **Spaces access keys**
2. Click **"Generate New Key"**
3. Configure:
   - **Name**: `aigrowise-production-access`
   - **Scope**: **Read and Write access to Spaces**
4. **IMPORTANT**: Copy both keys immediately - you won't see the secret again!

### Step 3: Configure CORS (1 minute)

In your new Space settings:

1. Go to **Settings** → **CORS (Cross Origin Resource Sharing)**
2. Add this rule:
```json
{
  "allowed_origins": ["https://dashboard.aigrowise.com"],
  "allowed_methods": ["GET", "POST", "PUT", "DELETE"],
  "allowed_headers": ["*"],
  "max_age_seconds": 3600
}
```

### Step 4: Update Server Credentials (1 minute)

SSH to your server and run:

```bash
# SSH to your server
ssh root@dashboard.aigrowise.com

# Navigate to project directory
cd /var/www/bmad-aigrowise/scripts

# Make script executable and run
chmod +x update-spaces-credentials.sh
./update-spaces-credentials.sh
```

The script will prompt for:
- **Access Key ID**: (from Step 2)
- **Secret Access Key**: (from Step 2, input hidden)
- **Bucket Name**: Press Enter for default `aigrowise-ndvi-images`
- **Region**: Press Enter for default `nyc3`
- **Endpoint**: Press Enter for default

## 🧪 Test Configuration

After updating credentials, test the setup:

```bash
cd /var/www/bmad-aigrowise
node scripts/test-spaces-connection.js
```

**Expected output:**
```
✅ Bucket connectivity successful
✅ File upload successful
✅ File download successful - content verified
✅ Public URL access successful
🎉 All tests completed successfully!
```

## 🚀 Restart Application

If tests pass, restart your application:

```bash
pm2 restart aigrowise-dashboard
# or if using different PM2 config:
pm2 restart ecosystem.config.js
```

## 🔍 Verify Everything Works

1. **Health Check**: 
   ```bash
   curl https://dashboard.aigrowise.com/api/health
   ```

2. **Web Interface Test**:
   - Go to `https://dashboard.aigrowise.com/admin`
   - Login as admin
   - Create a test client
   - Login as client and upload an NDVI image
   - Verify image appears in gallery

## 🚨 Troubleshooting

### Common Issues:

**❌ "NoSuchBucket" Error**
- Solution: Ensure bucket name is exactly `aigrowise-ndvi-images`

**❌ "InvalidAccessKeyId" Error**  
- Solution: Double-check Access Key ID was copied correctly

**❌ "SignatureDoesNotMatch" Error**
- Solution: Double-check Secret Access Key was copied correctly

**❌ CORS Error in Browser**
- Solution: Add CORS rule (Step 3) with your exact domain

**❌ Upload fails with large files**
- Check file size limit (50MB max configured)
- Check server disk space: `df -h`

## 📊 Expected Costs

- **Storage**: $0.02/GB/month
- **Transfer**: $0.01/GB (first 1TB free monthly)
- **Typical usage**: $5-15/month for agricultural platform

## 🎉 Success Indicators

When everything is working:

✅ Test script passes all checks  
✅ Health endpoint shows storage as "healthy"  
✅ Admin can upload images via web interface  
✅ Clients can view uploaded images  
✅ Images load quickly via CDN  
✅ No errors in PM2 logs: `pm2 logs`

## 📞 Final Steps

1. **Monitor Usage**: Check DigitalOcean dashboard regularly
2. **Set Alerts**: Configure billing alerts for unexpected usage
3. **Create Client Accounts**: Start onboarding your agricultural clients
4. **Test with Real Data**: Upload actual NDVI images from clients

---

**Your agricultural intelligence platform is ready for production! 🌱☁️**

**Total setup time: ~5 minutes**