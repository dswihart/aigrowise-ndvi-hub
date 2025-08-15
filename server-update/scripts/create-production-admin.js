const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createProductionAdmin() {
  try {
    console.log('🔐 Creating production admin user...');
    
    const email = 'admin@aigrowise.com';
    // Generate a secure random password for production
    const password = crypto.randomBytes(12).toString('base64').slice(0, 16);
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingAdmin) {
      console.log('⚠️  Production admin user already exists');
      console.log('📧 Email:', email);
      console.log('🔄 Use password reset if needed');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Production admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', password);
    console.log('⚠️  IMPORTANT: Save these credentials securely!');
    console.log('🔒 Consider changing the password after first login');
    
  } catch (error) {
    console.error('❌ Error creating production admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdmin();