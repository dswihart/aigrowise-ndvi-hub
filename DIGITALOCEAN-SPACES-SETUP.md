# 🌊 DigitalOcean Spaces Setup - Complete Guide

## 📋 Setup Status: Ready for Configuration

Your dashboard.aigrowise.com system has all the code ready for DigitalOcean Spaces integration. You now need to complete the configuration with real credentials.

## 🎯 Quick Start (5 Minutes)

### Step 1: Create DigitalOcean Spaces Bucket (2 mins)
1. Go to [DigitalOcean Spaces](https://cloud.digitalocean.com/spaces)
2. Click **"Create a Space"**
3. Configure:
   - **Name**: `aigrowise-ndvi-images`
   - **Region**: NYC3 
   - **File Listing**: Enable
   - **CDN**: Enable (recommended)
4. Click **"Create a Space"**

### Step 2: Generate API Keys (1 min)
1. Go to **API** → **Spaces access keys**
2. Click **"Generate New Key"**
3. Name: `aigrowise-production-access`
4. Scope: **Read and Write access to Spaces**
5. **Save both keys securely!**

### Step 3: Update Credentials (1 min)
```bash
# On Windows
cd C:\Users\dswih\Documents\bmad-aigrowise\scripts
update-spaces-credentials.bat

# On Linux/macOS
cd /path/to/bmad-aigrowise/scripts
./update-spaces-credentials.sh
```

### Step 4: Test Configuration (1 min)
```bash
cd C:\Users\dswih\Documents\bmad-aigrowise
node scripts/test-spaces-connection.js
```

## 🔧 What's Already Implemented

✅ **Complete S3-Compatible Storage Client**
- File upload/download/delete operations
- Presigned URL generation for secure access
- Public URL generation for web display
- Error handling and validation

✅ **Production-Ready Image Processing**
- Automatic thumbnail generation
- NDVI-specific format validation
- Metadata extraction and storage
- Size and format optimization

✅ **Secure Upload API Endpoint**
- File type validation (TIFF, PNG, JPG, WebP)
- Size limits (50MB max)
- Virus scanning ready
- Progress tracking

✅ **Admin & Client UI Integration**
- Drag-and-drop upload interface
- Image gallery with modal views
- Progress indicators and error handling
- Responsive design for all devices

## 🌐 CORS Configuration

After creating your Space, add this CORS rule:

**Location**: Space Settings → CORS (Cross Origin Resource Sharing)

```json
{
  "allowed_origins": ["https://dashboard.aigrowise.com"],
  "allowed_methods": ["GET", "POST", "PUT", "DELETE"],
  "allowed_headers": ["*"],
  "max_age_seconds": 3600
}
```

## 📊 Expected Usage & Costs

### Storage Costs (DigitalOcean Spaces)
- **Storage**: $0.02/GB/month
- **Transfer**: $0.01/GB (first 1TB free monthly)  
- **Requests**: Minimal (usually under $1/month)

### Estimated Monthly Costs
- **Small farm (100 images/month)**: ~$2-5
- **Medium operation (500 images/month)**: ~$8-15
- **Large enterprise (2000+ images/month)**: ~$20-40

## 🚀 Deployment Integration

Once configured, your deployment will automatically:

1. **Install Dependencies**
   ```bash
   npm install  # Includes AWS SDK, sharp, uuid
   ```

2. **Load Environment Variables**
   ```bash
   source env.production  # Your Spaces credentials
   ```

3. **Test Connectivity**
   ```bash
   node scripts/test-spaces-connection.js
   ```

4. **Start Application**
   ```bash
   pm2 start ecosystem.config.js
   ```

## 🔍 Testing Your Setup

### 1. Connection Test
```bash
node scripts/test-spaces-connection.js
```
**Expected Output:**
```
✅ Bucket connectivity successful
✅ File upload successful: https://nyc3.digitaloceanspaces.com/aigrowise-ndvi-images/test/...
✅ File download successful - content verified
✅ Public URL access successful
🎉 All tests completed successfully!
```

### 2. Web Interface Test
1. Go to `https://dashboard.aigrowise.com/admin`
2. Login as admin
3. Create a test client account
4. Login as client
5. Upload a test NDVI image
6. Verify image appears in gallery

### 3. API Endpoint Test
```bash
curl -X POST https://dashboard.aigrowise.com/api/images/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-image.tif" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Features

✅ **Access Control**
- API keys with specific permissions
- JWT-based authentication
- Role-based access (admin/client)

✅ **File Security**
- Type validation (only image formats)
- Size limits (50MB max per file)
- Virus scanning ready
- Secure filename generation

✅ **Data Protection**
- HTTPS-only access
- Encrypted data transfer
- Secure credential storage
- Audit logging ready

## 📁 File Organization

Your images will be organized as:
```
aigrowise-ndvi-images/
├── images/
│   ├── {uuid}.tiff         # Original NDVI images
│   ├── {uuid}.jpg          # Processed thumbnails
│   └── {uuid}.webp         # Optimized web versions
├── test/                   # Test files (safe to delete)
└── backups/                # Backup storage (future)
```

## 🚨 Troubleshooting

### Common Issues & Solutions

**❌ "NoSuchBucket" Error**
```bash
# Solution: Create the bucket in DigitalOcean console
# Bucket name must be: aigrowise-ndvi-images
```

**❌ "InvalidAccessKeyId" Error**
```bash
# Solution: Check your access key ID
# Make sure you copied it correctly from DigitalOcean
```

**❌ "SignatureDoesNotMatch" Error**
```bash
# Solution: Check your secret access key
# Regenerate keys if needed
```

**❌ CORS Error in Browser**
```bash
# Solution: Add CORS rule to your Space
# Allow origin: https://dashboard.aigrowise.com
```

**❌ Upload Timeout**
```bash
# Solution: Check file size (must be < 50MB)
# Check internet connection
# Try smaller test file first
```

## 🎉 Success Indicators

When everything is working correctly, you'll see:

✅ Test script passes all 4 tests  
✅ Admin can upload images via web interface  
✅ Clients can view their uploaded images  
✅ Images are publicly accessible via CDN URLs  
✅ Thumbnails are generated automatically  
✅ Health check endpoint reports storage as "healthy"  

## 📞 Next Steps

1. **Complete the setup** using the scripts provided
2. **Test thoroughly** with real NDVI images
3. **Monitor usage** in DigitalOcean dashboard
4. **Set up alerts** for storage usage/costs
5. **Document your workflow** for team members

## 🔗 Useful Links

- [DigitalOcean Spaces Console](https://cloud.digitalocean.com/spaces)
- [DigitalOcean API Keys](https://cloud.digitalocean.com/account/api/tokens)
- [Your Dashboard](https://dashboard.aigrowise.com)
- [Health Check](https://dashboard.aigrowise.com/api/health)

---

**Your agricultural intelligence platform is ready for cloud storage! 🌱☁️**