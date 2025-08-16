const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating fresh users...');
    
    // Clear existing users
    await prisma.user.deleteMany();
    console.log('✅ Users cleared');
    
    // Create admin
    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        id: 'admin-001',
        email: 'admin@aigrowise.com',
        password: adminHash,
        role: 'ADMIN'
      }
    });
    console.log('✅ Admin created:', admin.email);
    
    // Create client
    const clientHash = await bcrypt.hash('client123', 12);
    const client = await prisma.user.create({
      data: {
        id: 'client-001', 
        email: 'client@test.com',
        password: clientHash,
        role: 'CLIENT'
      }
    });
    console.log('✅ Client created:', client.email);
    
    // Test passwords
    const adminTest = await bcrypt.compare('admin123', admin.password);
    console.log('🔑 Admin password test:', adminTest);
    
    const clientTest = await bcrypt.compare('client123', client.password);
    console.log('🔑 Client password test:', clientTest);
    
    console.log('🎉 All users created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.();
  }
}

createUsers();
