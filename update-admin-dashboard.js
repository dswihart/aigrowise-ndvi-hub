#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🔄 Updating admin dashboard with client creation functionality...');
console.log('📡 Connecting to dashboard.aigrowise.com...');

// Script to update the server with new files
const updateScript = `
cd /var/www/aigrowise
echo "Stopping application..."
pm2 stop aigrowise-ndvi-hub

echo "Updating admin dashboard files..."
# We'll need to copy the new files here

echo "Rebuilding application..."
cd apps/nextjs && npm run build && cd ../..

echo "Restarting application..."
pm2 restart aigrowise-ndvi-hub

echo "Update completed!"
pm2 status
`;

console.log('ℹ️  Manual deployment required:');
console.log('');
console.log('1. Copy the updated files to the server:');
console.log('   scp -r apps/nextjs/app/admin/ root@dashboard.aigrowise.com:/var/www/aigrowise/apps/nextjs/app/');
console.log('');
console.log('2. SSH to the server and rebuild:');
console.log('   ssh root@dashboard.aigrowise.com');
console.log('   cd /var/www/aigrowise');
console.log('   pm2 stop aigrowise-ndvi-hub');
console.log('   cd apps/nextjs && npm run build && cd ../..');
console.log('   pm2 restart aigrowise-ndvi-hub');
console.log('');
console.log('3. Test the new functionality:');
console.log('   https://dashboard.aigrowise.com/admin');
console.log('   https://dashboard.aigrowise.com/admin/create-client');
console.log('   https://dashboard.aigrowise.com/admin/clients');
console.log('');
console.log('✨ New features added:');
console.log('• Dedicated client creation page');
console.log('• Client management page with list view'); 
console.log('• Navigation buttons on main admin dashboard');
console.log('• Better error handling and validation');
console.log('• Success messages and redirects');