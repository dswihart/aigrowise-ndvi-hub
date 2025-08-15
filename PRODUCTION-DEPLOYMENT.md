# 🌱 Aigrowise NDVI Hub - Production Deployment Guide

## 📋 Prerequisites

- **Server**: Ubuntu 20.04+ LTS or similar Linux distribution
- **Node.js**: Version 18.0+ 
- **PostgreSQL**: Version 16.3+
- **Nginx**: Latest stable version
- **PM2**: Process manager for Node.js
- **Root Access**: Required for initial setup

## 🚀 Deployment Steps

### Step 1: Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### Step 2: Database Setup
```bash
# Switch to postgres user and create database
sudo -u postgres psql -f scripts/setup-production-db.sql

# Verify database creation
sudo -u postgres psql -c "\l" | grep aigrowise_production
```

### Step 3: Application Deployment
```bash
# Clone/copy your application to server
# Navigate to application directory
cd /var/www/aigrowise  # or your chosen path

# Install dependencies
npm ci --only=production

# Generate Prisma client
npx prisma generate --schema=./packages/db/schema.prisma

# Run database migration
DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production" \
npx prisma migrate deploy --schema=./packages/db/schema.prisma

# Build Next.js application
cd apps/nextjs && npm run build && cd ../..

# Create logs directory
mkdir -p logs

# Create production admin user
DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production" \
node scripts/create-production-admin.js
```

### Step 4: Process Manager (PM2)
```bash
# Update ecosystem.config.js with correct path
# Start application with PM2
pm2 start config/ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Step 5: Nginx Configuration
```bash
# Copy Nginx configuration
sudo cp config/nginx.conf /etc/nginx/sites-available/aigrowise-ndvi-hub

# Enable the site
sudo ln -s /etc/nginx/sites-available/aigrowise-ndvi-hub /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 6: SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Create symlink
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Get SSL certificate
sudo certbot --nginx -d dashboard.aigrowise.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 7: Firewall Setup
```bash
# Configure UFW firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 🔐 Production Configuration

### Environment Variables
The application uses these production environment variables:

```bash
DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production"
NEXTAUTH_SECRET="aigrowise-production-secret-2025-ndvi-hub-secure"
NEXTAUTH_URL="https://dashboard.aigrowise.com"
APP_BASE_URL="https://dashboard.aigrowise.com"
NODE_ENV="production"
```

### Admin Credentials
After running the deployment script, you'll receive:
- **Email**: `admin@aigrowise.com`
- **Password**: Generated secure password (save this!)

## 📊 Monitoring & Maintenance

### PM2 Commands
```bash
# Check application status
pm2 status

# View logs
pm2 logs aigrowise-ndvi-hub

# Restart application
pm2 restart aigrowise-ndvi-hub

# Monitor performance
pm2 monit
```

### Database Backup
```bash
# Create backup script
cat > backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/aigrowise"
mkdir -p $BACKUP_DIR
pg_dump -h localhost -U aigrowise_user -d aigrowise_production > $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql
EOF

# Make executable and run
chmod +x backup-database.sh
./backup-database.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/backup-database.sh" | crontab -
```

### Log Rotation
```bash
# Configure logrotate for application logs
sudo tee /etc/logrotate.d/aigrowise << EOF
/var/www/aigrowise/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

## 🔍 Health Checks

### Application Health
- **URL**: `https://dashboard.aigrowise.com/api/health`
- **Expected Response**: `{"status": "ok", "timestamp": "..."}`

### Database Health
```bash
# Test database connection
DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production" \
node -e "const {PrismaClient} = require('@prisma/client'); new PrismaClient().\$connect().then(() => console.log('DB OK')).catch(console.error)"
```

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**
   - Check PM2 logs: `pm2 logs aigrowise-ndvi-hub`
   - Verify environment variables
   - Check database connectivity

2. **502 Bad Gateway**
   - Ensure PM2 process is running: `pm2 status`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/aigrowise-error.log`
   - Verify port 3000 is available: `sudo netstat -tlnp | grep :3000`

3. **Database connection errors**
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check database credentials
   - Test direct database connection

4. **SSL Certificate issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate expiry: `sudo certbot certificates`

## 📞 Support

For production support and maintenance:
- **Application Logs**: `/var/www/aigrowise/logs/`
- **Nginx Logs**: `/var/log/nginx/aigrowise-*.log`
- **System Logs**: `sudo journalctl -u nginx`

## 🔄 Updates & Maintenance

### Application Updates
```bash
# Stop application
pm2 stop aigrowise-ndvi-hub

# Pull latest code
git pull origin main

# Install dependencies
npm ci --only=production

# Run migrations if needed
npx prisma migrate deploy --schema=./packages/db/schema.prisma

# Rebuild application
cd apps/nextjs && npm run build && cd ../..

# Restart application
pm2 restart aigrowise-ndvi-hub
```

### Security Updates
```bash
# Update system packages monthly
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
npm audit fix --production-only

# Rotate SSL certificates automatically via Certbot cron job
```

---

**🌱 Your Aigrowise NDVI Hub is now ready for production!**
**🌐 Access: https://dashboard.aigrowise.com**