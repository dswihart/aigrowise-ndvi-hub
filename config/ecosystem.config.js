// PM2 configuration for Aigrowise NDVI Hub
module.exports = {
  apps: [
    {
      name: 'aigrowise-ndvi-hub',
      script: 'apps/nextjs/server.js',
      cwd: '/path/to/bmad-aigrowise', // Update with actual deployment path
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production',
        NEXTAUTH_SECRET: 'aigrowise-production-secret-2025-ndvi-hub-secure',
        NEXTAUTH_URL: 'https://dashboard.aigrowise.com',
        APP_BASE_URL: 'https://dashboard.aigrowise.com'
      },
      error_file: './logs/aigrowise-error.log',
      out_file: './logs/aigrowise-out.log',
      log_file: './logs/aigrowise-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/bmad-aigrowise.git',
      path: '/var/www/aigrowise',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};