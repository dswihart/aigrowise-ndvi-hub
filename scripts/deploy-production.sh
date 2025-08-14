#!/bin/bash

# Aigrowise NDVI Hub - Production Deployment Script
# Run this script with root privileges on your server

echo "🌱 Aigrowise NDVI Hub - Production Deployment"
echo "=============================================="

# Step 1: Setup PostgreSQL database
echo "📊 Setting up PostgreSQL database..."
sudo -u postgres psql -f scripts/setup-production-db.sql

# Step 2: Install dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Step 3: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate --schema=./packages/db/schema.prisma

# Step 4: Run database migration
echo "🗄️ Running database migration..."
DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production" \
npx prisma migrate deploy --schema=./packages/db/schema.prisma

# Step 5: Build the application
echo "🏗️ Building Next.js application..."
cd apps/nextjs && npm run build && cd ../..

# Step 6: Create production admin user
echo "👤 Creating production admin user..."
DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production" \
node scripts/create-production-admin.js

echo "✅ Deployment completed successfully!"
echo ""
echo "🚀 Your Aigrowise NDVI Hub is ready for production!"
echo "📍 Access admin panel: https://dashboard.aigrowise.com/admin"
echo "👤 Admin login: admin@aigrowise.com"
echo "🔑 Admin password: (check terminal output above)"
echo ""
echo "📝 Next steps:"
echo "1. Configure Nginx reverse proxy"
echo "2. Set up PM2 process manager"  
echo "3. Configure SSL certificate"
echo "4. Set up monitoring and backups"