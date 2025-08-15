#!/bin/bash

# Deployment script for Digital Ocean Droplet
# This script should be run on the Digital Ocean Droplet

echo "🚀 Starting deployment of Aigrowise NDVI Hub..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /opt/aigrowise
cd /opt/aigrowise

# Copy application files (assuming you've uploaded them)
echo "📋 Copying application files..."
# Note: You'll need to upload your application files to this directory

# Build and start the application
echo "🔨 Building and starting the application..."
sudo docker-compose up -d --build

# Wait for the application to start
echo "⏳ Waiting for application to start..."
sleep 30

# Check if the application is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo "🌐 Access your application at: http://YOUR_DROPLET_IP:3000"
else
    echo "❌ Application failed to start. Check logs with: docker-compose logs"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
