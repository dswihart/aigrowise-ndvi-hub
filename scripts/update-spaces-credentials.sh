#!/bin/bash

# DigitalOcean Spaces Credentials Update Script
# This script helps you securely update your Spaces credentials in the production environment

set -e  # Exit on any error

ENV_FILE="../env.production"
BACKUP_FILE="../env.production.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 DigitalOcean Spaces Credentials Update Script"
echo "================================================"
echo ""

# Check if env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: env.production file not found!"
    echo "Expected location: $ENV_FILE"
    exit 1
fi

# Create backup
echo "💾 Creating backup of current env.production..."
cp "$ENV_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Get credentials from user
echo "🔑 Please enter your DigitalOcean Spaces credentials:"
echo ""

read -p "Access Key ID: " ACCESS_KEY
if [ -z "$ACCESS_KEY" ]; then
    echo "❌ Access Key ID cannot be empty"
    exit 1
fi

read -s -p "Secret Access Key: " SECRET_KEY
echo ""  # New line after hidden input
if [ -z "$SECRET_KEY" ]; then
    echo "❌ Secret Access Key cannot be empty"
    exit 1
fi

echo ""
read -p "Bucket Name (default: aigrowise-ndvi-images): " BUCKET_NAME
BUCKET_NAME=${BUCKET_NAME:-aigrowise-ndvi-images}

read -p "Region (default: nyc3): " REGION
REGION=${REGION:-nyc3}

read -p "Endpoint (default: https://nyc3.digitaloceanspaces.com): " ENDPOINT
ENDPOINT=${ENDPOINT:-https://nyc3.digitaloceanspaces.com}

echo ""
echo "📝 Updating credentials..."

# Update the environment file
sed -i.tmp "s/DO_SPACES_ACCESS_KEY=.*/DO_SPACES_ACCESS_KEY=\"$ACCESS_KEY\"/" "$ENV_FILE"
sed -i.tmp "s/DO_SPACES_SECRET_KEY=.*/DO_SPACES_SECRET_KEY=\"$SECRET_KEY\"/" "$ENV_FILE"
sed -i.tmp "s/DO_SPACES_BUCKET=.*/DO_SPACES_BUCKET=\"$BUCKET_NAME\"/" "$ENV_FILE"
sed -i.tmp "s/DO_SPACES_REGION=.*/DO_SPACES_REGION=\"$REGION\"/" "$ENV_FILE"
sed -i.tmp "s|DO_SPACES_ENDPOINT=.*|DO_SPACES_ENDPOINT=\"$ENDPOINT\"|" "$ENV_FILE"

# Remove temporary file
rm "$ENV_FILE.tmp"

echo "✅ Credentials updated successfully!"
echo ""
echo "🔍 Updated configuration:"
echo "  Access Key: $ACCESS_KEY"
echo "  Bucket: $BUCKET_NAME"
echo "  Region: $REGION"
echo "  Endpoint: $ENDPOINT"
echo ""
echo "🧪 Next steps:"
echo "  1. Test the connection: node scripts/test-spaces-connection.js"
echo "  2. If successful, restart your application"
echo "  3. Test image upload functionality"
echo ""
echo "📁 Backup location: $BACKUP_FILE"