const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...');
    
    const email = 'admin@aigrowise.com';
    const password = 'admin123';  // Known password
    
    // Delete existing admin if any
    await prisma.user.deleteMany({
      where: { email }
    });
    console.log('🗑️  Deleted existing admin user if any');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('🔐 Password hashed successfully');
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', admin.role);
    
    // Test the created user
    const testUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (testUser) {
      const isValidPassword = await bcrypt.compare(password, testUser.password);
      console.log('🧪 Password test result:', isValidPassword);
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.();
  }
}

createAdmin();
