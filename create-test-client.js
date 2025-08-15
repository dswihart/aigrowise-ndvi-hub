#!/usr/bin/env node

const { exec } = require('child_process');

console.log('🔐 Creating a test client account...');

const createClientScript = `
cd /var/www/aigrowise
export DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production"
node scripts/create-test-client.js
`;

exec(`ssh root@dashboard.aigrowise.com "${createClientScript}"`, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Manual steps to create a client:');
        console.log('1. SSH: ssh root@dashboard.aigrowise.com');
        console.log('2. CD: cd /var/www/aigrowise'); 
        console.log('3. Run: export DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production"');
        console.log('4. Run: node scripts/create-test-client.js');
        return;
    }

    console.log('📤 Server output:');
    console.log(stdout);
    
    if (stderr) {
        console.log('⚠️  Server errors:');
        console.log(stderr);
    }
    
    console.log('✅ Client creation completed!');
    console.log('🌐 Test login at: https://dashboard.aigrowise.com/login');
    console.log('📧 Email: client@test.com');
    console.log('🔑 Password: test123');
});