const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestClient() {
  try {
    const email = 'client@example.com';
    const password = 'client123';
    
    // Check if client already exists
    const existingClient = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingClient) {
      console.log('Test client already exists');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create client user
    const client = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'CLIENT'
      }
    });
    
    console.log('Test client created successfully:', client.email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error creating test client:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClient();