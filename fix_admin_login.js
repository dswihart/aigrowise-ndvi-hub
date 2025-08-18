const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('Connecting to database...');
    
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@aigrowise.com' }
    });

    const hashedPassword = await bcrypt.hash('admin123', 12);

    if (existingAdmin) {
      console.log('Updating existing admin user...');
      await prisma.user.update({
        where: { email: 'admin@aigrowise.com' },
        data: { password: hashedPassword }
      });
      console.log('Admin password updated successfully!');
    } else {
      console.log('Creating new admin user...');
      await prisma.user.create({
        data: {
          email: 'admin@aigrowise.com',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('Admin user created successfully!');
    }

    console.log('You can now login with:');
    console.log('Email: admin@aigrowise.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();