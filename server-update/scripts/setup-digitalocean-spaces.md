# DigitalOcean Spaces Setup Guide

## Step 1: Create DigitalOcean Spaces Bucket

1. **Log into DigitalOcean Control Panel**
   - Go to https://cloud.digitalocean.com/
   - Navigate to **Spaces Object Storage** in the left sidebar

2. **Create New Space**
   - Click **"Create a Space"**
   - **Name**: `aigrowise-ndvi-images`
   - **Region**: NYC3 (matches current config)
   - **File Listing**: **Enable** (for admin management)
   - **CDN**: **Enable** (for faster image delivery)
   - Click **"Create a Space"**

## Step 2: Generate API Access Keys

1. **Navigate to API Section**
   - Go to **API** → **Spaces access keys**
   - Click **"Generate New Key"**

2. **Create New Key**
   - **Name**: `aigrowise-production-access`
   - **Scope**: **Read and Write access to Spaces**
   - Click **"Generate Access Key"**

3. **Save Credentials Securely**
   - Copy the **Access Key ID** and **Secret Access Key**
   - Store them securely - you won't see the secret again!

## Step 3: Configure CORS for Browser Uploads

1. **Access Space Settings**
   - Go to your `aigrowise-ndvi-images` space
   - Click on **Settings** tab
   - Find **CORS (Cross Origin Resource Sharing)**

2. **Add CORS Rule**
   ```json
   {
     "allowed_origins": ["https://dashboard.aigrowise.com"],
     "allowed_methods": ["GET", "POST", "PUT", "DELETE"],
     "allowed_headers": ["*"],
     "max_age_seconds": 3600
   }
   ```

## Step 4: Update Environment Variables

Replace the placeholder values in `env.production`:

```bash
# DigitalOcean Spaces Configuration
DO_SPACES_ACCESS_KEY="your-actual-access-key-here"
DO_SPACES_SECRET_KEY="your-actual-secret-key-here"
```

## Step 5: Test Configuration

Run the test script (to be created):
```bash
cd /var/www/aigrowise
node scripts/test-spaces-connection.js
```

## Security Notes

- Keep your access keys secure and never commit them to version control
- Consider using DigitalOcean's API to rotate keys regularly
- Monitor usage in the DigitalOcean dashboard
- Set up billing alerts to avoid unexpected costs

## Expected Costs

- **Storage**: ~$0.02/GB/month
- **Transfer**: ~$0.01/GB (first 1TB free monthly)
- **Requests**: Minimal cost for API calls

For an agriculture platform with moderate usage, expect $5-20/month.