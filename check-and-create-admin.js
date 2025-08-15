#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

// This script will run on the production server to check/create admin user
const remoteScript = `
cd /var/www/aigrowise
export DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production"
node scripts/create-production-admin.js 2>&1
`;

console.log('🔐 Checking and creating admin user on production server...');
console.log('📡 Connecting to dashboard.aigrowise.com...');

exec(`ssh root@dashboard.aigrowise.com "${remoteScript}"`, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Error connecting to server:', error.message);
        console.log('💡 Manual steps:');
        console.log('1. SSH to server: ssh root@dashboard.aigrowise.com');
        console.log('2. Run: cd /var/www/aigrowise');
        console.log('3. Run: export DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production"');
        console.log('4. Run: node scripts/create-production-admin.js');
        return;
    }

    console.log('📤 Server output:');
    console.log(stdout);
    
    if (stderr) {
        console.log('⚠️  Server errors:');
        console.log(stderr);
    }

    console.log('✅ Admin creation check completed!');
    console.log('🌐 You can now test login at: https://dashboard.aigrowise.com/login');
});