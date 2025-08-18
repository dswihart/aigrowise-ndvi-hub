const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestClient() {
  try {
    console.log('Creating test client...');
    
    // Check if test client already exists
    const existingClient = await prisma.user.findUnique({
      where: { email: 'client@aigrowise.com' }
    });

    const hashedPassword = await bcrypt.hash('client123', 12);

    if (existingClient) {
      console.log('Updating existing test client...');
      await prisma.user.update({
        where: { email: 'client@aigrowise.com' },
        data: { password: hashedPassword }
      });
      console.log('Test client password updated successfully!');
    } else {
      console.log('Creating new test client...');
      await prisma.user.create({
        data: {
          email: 'client@aigrowise.com',
          password: hashedPassword,
          role: 'CLIENT'
        }
      });
      console.log('Test client created successfully!');
    }

    console.log('Test client credentials:');
    console.log('Email: client@aigrowise.com');
    console.log('Password: client123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClient();