# 🐳 Aigrowise NDVI Hub - Docker Deployment Guide

## 🎯 Quick Deployment

### For Ubuntu Server with Docker

```bash
# SSH to your server as root
ssh root@dashboard.aigrowise.com

# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/your-repo/bmad-aigrowise/main/scripts/server-deploy.sh | bash
```

### Manual Deployment Steps

1. **Clone Repository**
```bash
git clone https://github.com/your-repo/bmad-aigrowise.git
cd bmad-aigrowise
```

2. **Deploy with Docker Compose**
```bash
# Build and start all services
docker-compose up -d --build

# Wait for services to start
sleep 30

# Run database migration
docker-compose exec app npx prisma migrate deploy --schema=./packages/db/schema.prisma

# Create admin user
docker-compose exec app node scripts/create-production-admin.js
```

## 📦 Services Included

- **PostgreSQL 16**: Database with persistent storage
- **Next.js App**: Main application container
- **Nginx**: Reverse proxy and load balancer

## 🔧 Configuration

### Environment Variables
All environment variables are configured in `docker-compose.yml`:

```yaml
DATABASE_URL: "postgresql://aigrowise_user:aigrowise_pass@postgres:5432/aigrowise_production"
NEXTAUTH_SECRET: "aigrowise-production-secret-2025-ndvi-hub-secure"
NEXTAUTH_URL: "https://dashboard.aigrowise.com"
APP_BASE_URL: "https://dashboard.aigrowise.com"
NODE_ENV: "production"
```

### Port Mapping
- **80**: HTTP (Nginx)
- **443**: HTTPS (Nginx) 
- **5432**: PostgreSQL (internal)
- **3000**: Next.js App (internal)

## 🔍 Health Checks

### Application Health
```bash
curl http://localhost/api/health
```

### Service Status
```bash
docker-compose ps
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f nginx
```

## 📊 Database Management

### Backup Database
```bash
docker-compose exec postgres pg_dump -U aigrowise_user aigrowise_production > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U aigrowise_user aigrowise_production < backup.sql
```

### Access Database
```bash
docker-compose exec postgres psql -U aigrowise_user -d aigrowise_production
```

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run any new migrations
docker-compose exec app npx prisma migrate deploy --schema=./packages/db/schema.prisma
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app
docker-compose restart nginx
```

## 🔒 SSL Setup (Optional)

### Install Certbot
```bash
apt install certbot python3-certbot-nginx
```

### Get SSL Certificate
```bash
# Stop nginx container first
docker-compose stop nginx

# Get certificate
certbot certonly --standalone -d dashboard.aigrowise.com

# Copy certificates to ssl directory
cp /etc/letsencrypt/live/dashboard.aigrowise.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/dashboard.aigrowise.com/privkey.pem ssl/

# Update nginx.conf to enable HTTPS
# Restart nginx container
docker-compose up -d nginx
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
```bash
# Check what's using the port
netstat -tulpn | grep :80
sudo fuser -k 80/tcp
```

2. **Database connection errors**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec app node -e "const {PrismaClient} = require('@prisma/client'); new PrismaClient().\$connect().then(() => console.log('DB OK')).catch(console.error)"
```

3. **Application not starting**
```bash
# Check application logs
docker-compose logs app

# Check build logs
docker-compose build app --no-cache
```

4. **Nginx 502 errors**
```bash
# Check if app container is running
docker-compose ps app

# Check nginx configuration
docker-compose exec nginx nginx -t

# Check upstream connection
docker-compose exec nginx wget -qO- http://app:3000/api/health
```

### Reset Everything
```bash
# Stop and remove all containers
docker-compose down -v

# Remove all images
docker system prune -a

# Restart deployment
docker-compose up -d --build
```

## 🔐 Security Checklist

- [ ] Change default database password
- [ ] Update NEXTAUTH_SECRET with random secure string
- [ ] Configure firewall (UFW)
- [ ] Set up SSL certificate
- [ ] Enable automatic security updates
- [ ] Configure log rotation
- [ ] Set up monitoring

## 📞 Support Commands

```bash
# Show service status
docker-compose ps

# Show resource usage
docker stats

# Show network info
docker network ls

# Show volumes
docker volume ls

# Interactive shell in app container
docker-compose exec app sh

# Database shell
docker-compose exec postgres psql -U aigrowise_user -d aigrowise_production
```

---

## 🌱 Your Aigrowise NDVI Hub is now running with Docker!

**🌐 Access:** http://dashboard.aigrowise.com
**👤 Admin:** http://dashboard.aigrowise.com/admin