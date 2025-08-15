const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createClient() {
  try {
    // Get email and password from command line arguments
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.log('Usage: node create-client.js <email> <password>');
      console.log('Example: node create-client.js farmer@example.com mypassword123');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Error: Please provide a valid email address');
      return;
    }
    
    // Validate password length
    if (password.length < 6) {
      console.log('Error: Password must be at least 6 characters long');
      return;
    }
    
    // Check if client already exists
    const existingClient = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingClient) {
      console.log(`Error: A user with email ${email} already exists`);
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
    
    console.log('✅ Client created successfully!');
    console.log(`📧 Email: ${client.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`📅 Created: ${client.createdAt.toLocaleString()}`);
    console.log(`🆔 ID: ${client.id}`);
    
  } catch (error) {
    console.error('❌ Error creating client:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createClient();