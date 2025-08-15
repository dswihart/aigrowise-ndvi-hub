#!/usr/bin/env node

/**
 * Comprehensive Deployment Verification Script
 * Tests all critical components of the aigrowise dashboard
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'env.production') });

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Aigrowise Dashboard Deployment Verification');
console.log('================================================\n');

const checks = [
  {
    name: 'Environment Variables',
    check: checkEnvironmentVariables,
  },
  {
    name: 'Node.js Dependencies',
    check: checkDependencies,
  },
  {
    name: 'Database Connection',
    check: checkDatabaseConnection,
  },
  {
    name: 'DigitalOcean Spaces',
    check: checkSpacesConnection,
  },
  {
    name: 'Application Build',
    check: checkApplicationBuild,
  },
  {
    name: 'PM2 Configuration',
    check: checkPM2Config,
  },
  {
    name: 'Nginx Configuration',
    check: checkNginxConfig,
  },
];

async function runVerification() {
  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      console.log(`🔍 Checking ${check.name}...`);
      await check.check();
      console.log(`✅ ${check.name}: PASSED\n`);
      passed++;
    } catch (error) {
      console.log(`❌ ${check.name}: FAILED`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log('📊 Verification Summary');
  console.log('======================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Score: ${passed}/${checks.length} (${Math.round((passed / checks.length) * 100)}%)\n`);

  if (failed === 0) {
    console.log('🎉 All checks passed! Your deployment is ready for production.');
    console.log('🚀 Next steps:');
    console.log('   1. Deploy to your DigitalOcean server');
    console.log('   2. Run the production deployment script');
    console.log('   3. Test the live application');
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above before deploying.');
    process.exit(1);
  }
}

function checkEnvironmentVariables() {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DO_SPACES_ACCESS_KEY',
    'DO_SPACES_SECRET_KEY',
    'DO_SPACES_BUCKET',
  ];

  const missing = [];
  const placeholder = [];

  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else if (value.includes('your-') || value.includes('placeholder')) {
      placeholder.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  if (placeholder.length > 0) {
    throw new Error(`Placeholder values detected: ${placeholder.join(', ')}`);
  }
}

function checkDependencies() {
  const packageJsonPath = path.join(__dirname, '..', 'apps', 'nextjs', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }

  // Check if node_modules exists
  const nodeModulesPath = path.join(__dirname, '..', 'apps', 'nextjs', 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    throw new Error('node_modules directory not found. Run npm install.');
  }

  // Check critical dependencies
  const criticalDeps = [
    '@aws-sdk/client-s3',
    '@prisma/client',
    'next',
    'sharp',
    'bcryptjs',
  ];

  for (const dep of criticalDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      throw new Error(`Critical dependency missing: ${dep}`);
    }
  }
}

async function checkDatabaseConnection() {
  try {
    // Try to import Prisma and test connection
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    await prisma.$disconnect();
  } catch (error) {
    if (error.message.includes('connect')) {
      throw new Error('Cannot connect to database. Check DATABASE_URL and ensure PostgreSQL is running.');
    }
    throw new Error(`Database error: ${error.message}`);
  }
}

async function checkSpacesConnection() {
  try {
    const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: process.env.DO_SPACES_REGION,
      credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
      },
      forcePathStyle: false,
    });

    const command = new ListObjectsV2Command({
      Bucket: process.env.DO_SPACES_BUCKET,
      MaxKeys: 1,
    });

    await s3Client.send(command);
  } catch (error) {
    if (error.Code === 'NoSuchBucket') {
      throw new Error('DigitalOcean Spaces bucket does not exist. Create it in the DO console.');
    }
    throw new Error(`Spaces connection failed: ${error.message}`);
  }
}

function checkApplicationBuild() {
  const buildPath = path.join(__dirname, '..', 'apps', 'nextjs', '.next');
  
  // For development, we'll just check if the build command works
  try {
    const cwd = path.join(__dirname, '..', 'apps', 'nextjs');
    execSync('npm run build', { 
      cwd,
      stdio: 'pipe',
      timeout: 120000, // 2 minutes timeout
    });
  } catch (error) {
    throw new Error('Application build failed. Check for TypeScript errors or missing dependencies.');
  }
}

function checkPM2Config() {
  const pm2ConfigPath = path.join(__dirname, '..', 'config', 'ecosystem.config.js');
  
  if (!fs.existsSync(pm2ConfigPath)) {
    throw new Error('PM2 configuration file not found');
  }

  try {
    require(pm2ConfigPath);
  } catch (error) {
    throw new Error(`PM2 configuration is invalid: ${error.message}`);
  }
}

function checkNginxConfig() {
  const nginxConfigPath = path.join(__dirname, '..', 'config', 'nginx.conf');
  
  if (!fs.existsSync(nginxConfigPath)) {
    throw new Error('Nginx configuration file not found');
  }

  const config = fs.readFileSync(nginxConfigPath, 'utf8');
  
  if (!config.includes('dashboard.aigrowise.com')) {
    throw new Error('Nginx configuration does not contain the correct domain');
  }

  if (!config.includes('proxy_pass')) {
    throw new Error('Nginx configuration missing proxy_pass directive');
  }
}

// Helper function to run shell commands
function runCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      ...options 
    }).trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

// Run the verification
runVerification().catch((error) => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});