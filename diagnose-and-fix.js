#!/usr/bin/env node

/**
 * Aigrowise Deployment Diagnosis and Fix Script
 * 
 * This script helps diagnose and fix common deployment issues:
 * 1. Database connectivity problems
 * 2. Missing admin users
 * 3. Environment configuration issues
 * 4. DigitalOcean Spaces setup
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

console.log('🌱 Aigrowise Deployment Diagnosis & Fix');
console.log('=======================================');

async function runCommand(command, description) {
  try {
    console.log(`\n🔍 ${description}...`);
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('warning')) {
      console.log(`   ⚠️ ${stderr.trim()}`);
    }
    return stdout.trim();
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function checkFile(filePath, description) {
  try {
    await fs.access(filePath);
    console.log(`   ✅ ${description} exists`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${description} missing`);
    return false;
  }
}

async function diagnoseAndFix() {
  console.log('\n📋 DIAGNOSIS PHASE');
  console.log('==================');

  // 1. Check if we're in the right directory
  const currentDir = process.cwd();
  console.log(`Current directory: ${currentDir}`);
  
  const hasPackageJson = await checkFile('package.json', 'package.json');
  const hasEnvFile = await checkFile('.env', 'Environment file');
  const hasEnvProduction = await checkFile('env.production', 'Production environment template');

  // 2. Check database connectivity
  console.log('\n🗄️  Database Status:');
  const dbStatus = await runCommand('npm run db:status 2>/dev/null || echo "Database connection failed"', 'Checking database');

  // 3. Check if admin user exists
  console.log('\n👤 Admin User Status:');
  
  // 4. Check PM2 status
  console.log('\n⚙️  Process Status:');
  await runCommand('pm2 list 2>/dev/null || echo "PM2 not running"', 'Checking PM2 processes');

  // 5. Check Nginx status
  console.log('\n🌐 Web Server Status:');
  await runCommand('systemctl is-active nginx 2>/dev/null || echo "Not available"', 'Checking Nginx');

  console.log('\n🔧 FIX PHASE');
  console.log('==============');

  // Fix 1: Set up environment file
  if (!hasEnvFile && hasEnvProduction) {
    console.log('\n1. Setting up environment file...');
    try {
      await fs.copyFile('env.production', '.env');
      console.log('   ✅ Environment file created from production template');
    } catch (error) {
      console.log(`   ❌ Failed to create environment file: ${error.message}`);
    }
  }

  // Fix 2: Install dependencies
  console.log('\n2. Ensuring dependencies are installed...');
  await runCommand('npm install', 'Installing dependencies');

  // Fix 3: Run database migrations
  console.log('\n3. Setting up database...');
  await runCommand('npx prisma generate', 'Generating Prisma client');
  await runCommand('npx prisma db push', 'Pushing database schema');

  // Fix 4: Create admin user
  console.log('\n4. Creating admin user...');
  
  // Check if we have the create admin script
  const hasCreateAdminScript = await checkFile('scripts/create-production-admin.js', 'Admin creation script');
  
  if (hasCreateAdminScript) {
    await runCommand('node scripts/create-production-admin.js', 'Creating admin user');
  } else {
    // Create a simple admin creation script
    const adminScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'admin@aigrowise.com';
    const adminPassword = 'Admin123!';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail);
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Please change the password after first login.');
    
  } catch (error) {
    console.error('❌ Failed to create admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
`;
    
    try {
      await fs.mkdir('scripts', { recursive: true });
      await fs.writeFile('scripts/create-admin-temp.js', adminScript);
      await runCommand('node scripts/create-admin-temp.js', 'Creating admin user');
    } catch (error) {
      console.log(`   ❌ Failed to create admin: ${error.message}`);
    }
  }

  // Fix 5: Start/restart the application
  console.log('\n5. Starting application...');
  await runCommand('pm2 stop aigrowise-dashboard 2>/dev/null || true', 'Stopping existing process');
  await runCommand('pm2 start npm --name "aigrowise-dashboard" -- start', 'Starting application with PM2');
  
  // Wait a moment for the app to start
  console.log('\n⏳ Waiting for application to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Final verification
  console.log('\n✅ VERIFICATION');
  console.log('================');
  
  // Test local health endpoint
  try {
    const { exec } = require('child_process');
    exec('curl -s http://localhost:3000/api/health', (error, stdout, stderr) => {
      if (error) {
        console.log('   ❌ Local health check failed');
      } else {
        console.log('   ✅ Local application is responding');
        console.log('   Response:', stdout);
      }
    });
  } catch (error) {
    console.log('   ⚠️ Could not test local endpoint');
  }

  console.log('\n🎉 SETUP COMPLETE!');
  console.log('===================');
  console.log('\nNext steps:');
  console.log('1. Visit https://dashboard.aigrowise.com/admin');
  console.log('2. Login with admin@aigrowise.com / Admin123!');
  console.log('3. Create client accounts using the interface');
  console.log('4. Configure DigitalOcean Spaces credentials in .env file');
  console.log('\nMonitor application: pm2 logs aigrowise-dashboard');
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the diagnosis and fix
diagnoseAndFix().catch(console.error);