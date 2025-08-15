// PM2 configuration for Aigrowise NDVI Hub
module.exports = {
  apps: [
    {
      name: 'aigrowise-ndvi-hub',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/aigrowise/apps/nextjs',
      instances: 1, // Single instance for file uploads
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production',
        NEXTAUTH_SECRET: 'aigrowise-production-secret-2025-ndvi-hub-secure',
        NEXTAUTH_URL: 'https://dashboard.aigrowise.com',
        APP_BASE_URL: 'https://dashboard.aigrowise.com',
        DO_SPACES_ENDPOINT: 'https://nyc3.digitaloceanspaces.com',
        DO_SPACES_REGION: 'nyc3',
        DO_SPACES_BUCKET: 'aigrowise-ndvi-images',
        DO_SPACES_ACCESS_KEY: process.env.DO_SPACES_ACCESS_KEY || 'your-access-key',
        DO_SPACES_SECRET_KEY: process.env.DO_SPACES_SECRET_KEY || 'your-secret-key',
        MAX_FILE_SIZE: '52428800',
        BCRYPT_ROUNDS: '12',
        LOG_LEVEL: 'info'
      },
      error_file: '/var/www/aigrowise/logs/aigrowise-error.log',
      out_file: '/var/www/aigrowise/logs/aigrowise-out.log',
      log_file: '/var/www/aigrowise/logs/aigrowise-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=2048',
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'dashboard.aigrowise.com',
      ref: 'origin/main',
      repo: 'https://github.com/your-org/bmad-aigrowise.git',
      path: '/var/www/aigrowise',
      'pre-deploy-local': '',
      'post-deploy': 'cd /var/www/aigrowise && npm ci --only=production && cd apps/nextjs && npm run build && cd ../.. && mkdir -p logs && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/aigrowise/logs'
    }
  }
};