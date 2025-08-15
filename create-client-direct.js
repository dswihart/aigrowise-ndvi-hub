#!/usr/bin/env node

const { exec } = require('child_process');

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.log('Usage: node create-client-direct.js <email> <password>');
    console.log('Example: node create-client-direct.js client@farm.com password123');
    process.exit(1);
}

console.log(`🔐 Creating client: ${email}`);
console.log('📡 Connecting to production server...');

const createScript = `
cd /var/www/bmad-aigrowise
export DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production"

cat > temp_create_client.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createClient() {
  try {
    const email = '${email}';
    const password = '${password}';
    
    // Check if client already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existing) {
      console.log('❌ Client already exists:', email);
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create client
    const client = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'CLIENT'
      }
    });
    
    console.log('✅ Client created successfully!');
    console.log('📧 Email:', client.email);
    console.log('🔑 Password:', password);
    console.log('🌐 Login at: https://dashboard.aigrowise.com/login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createClient();
EOF

node temp_create_client.js
rm temp_create_client.js
`;

exec(`ssh root@dashboard.aigrowise.com "${createScript}"`, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Connection error:', error.message);
        console.log('\n💡 Manual steps:');
        console.log('1. SSH: ssh root@dashboard.aigrowise.com');
        console.log('2. CD: cd /var/www/bmad-aigrowise');
        console.log('3. Run: export DATABASE_URL="postgresql://aigrowise_user:aigrowise_pass@localhost:5432/aigrowise_production"');
        console.log('4. Create script and run client creation');
        return;
    }

    console.log('📤 Server output:');
    console.log(stdout);
    
    if (stderr) {
        console.log('⚠️  Server errors:');
        console.log(stderr);
    }
    
    console.log('\n🎉 Client creation completed!');
    console.log('📋 Next steps:');
    console.log(`1. Test login at: https://dashboard.aigrowise.com/login`);
    console.log(`2. Email: ${email}`);
    console.log(`3. Password: ${password}`);
});