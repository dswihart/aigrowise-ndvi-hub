# 🚀 Deployment Guide - Aigrowise NDVI Hub

This guide will walk you through deploying the Aigrowise NDVI Hub application to a Digital Ocean Droplet.

## 📋 Prerequisites

- Digital Ocean account
- A Droplet with Ubuntu 20.04+ (recommended: 2GB RAM, 1 vCPU minimum)
- SSH access to your Droplet
- Domain name (optional, for production use)

## 🏗️ Local Build Preparation

Before deploying, ensure your local build is successful:

```bash
# Build the production version
npm run build

# Verify the build output
ls apps/nextjs/.next/
```

## 🐳 Docker Deployment

### Option 1: Using Docker Compose (Recommended)

1. **Upload your application to the Droplet:**
   ```bash
   # From your local machine, upload the project
   scp -r . user@your-droplet-ip:/opt/aigrowise/
   ```

2. **SSH into your Droplet:**
   ```bash
   ssh user@your-droplet-ip
   ```

3. **Navigate to the app directory:**
   ```bash
   cd /opt/aigrowise
   ```

4. **Make the deployment script executable:**
   ```bash
   chmod +x deploy.sh
   ```

5. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

### Option 2: Manual Docker Deployment

1. **Install Docker on your Droplet:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Build and run the container:**
   ```bash
   docker build -t aigrowise .
   docker run -d -p 3000:3000 --name aigrowise-app aigrowise
   ```

## 🔧 Configuration

### Environment Variables

1. **Copy the production environment file:**
   ```bash
   cp env.production .env
   ```

2. **Edit the environment variables:**
   ```bash
   nano .env
   ```

3. **Update the following variables:**
   - `DATABASE_URL`: Your production database connection string
   - `NEXTAUTH_SECRET`: A strong, random secret
   - `NEXTAUTH_URL`: Your production domain

### Database Setup

1. **Create a PostgreSQL database** (you can use Digital Ocean Managed Databases)
2. **Update the DATABASE_URL** in your environment file
3. **Run database migrations:**
   ```bash
   docker exec -it aigrowise-app npm run db:push
   ```

## 🌐 Domain and SSL Setup

1. **Point your domain** to your Droplet's IP address
2. **Set up Nginx as a reverse proxy:**
   ```bash
   sudo apt install nginx
   ```

3. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/aigrowise
   ```

4. **Add the following configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/aigrowise /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Set up SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 📊 Monitoring and Maintenance

### Health Checks

The application includes health checks. Monitor with:
```bash
docker ps
docker logs aigrowise-app
```

### Updates

To update the application:
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backup

Regular backups are recommended:
```bash
# Database backup
docker exec -it aigrowise-app npm run db:backup

# Application backup
tar -czf aigrowise-backup-$(date +%Y%m%d).tar.gz /opt/aigrowise
```

## 🚨 Troubleshooting

### Common Issues

1. **Port 3000 already in use:**
   ```bash
   sudo netstat -tulpn | grep :3000
   sudo kill -9 <PID>
   ```

2. **Docker permission issues:**
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

3. **Build failures:**
   ```bash
   docker system prune -a
   docker-compose build --no-cache
   ```

### Logs

Check application logs:
```bash
docker-compose logs -f app
```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all prerequisites are met
4. Check Digital Ocean Droplet status

## 🎯 Next Steps

After successful deployment:
1. Set up monitoring (e.g., UptimeRobot)
2. Configure automated backups
3. Set up CI/CD pipeline for future updates
4. Monitor performance and scale as needed

---

**Happy Deploying! 🚀**
