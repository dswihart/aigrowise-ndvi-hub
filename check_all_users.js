const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllUsers() {
  try {
    console.log('Checking all users in the database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { images: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${users.length} users:`);
    console.log('='.repeat(60));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Images: ${user._count.images}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log('-'.repeat(40));
    });

    const adminUsers = users.filter(u => u.role === 'ADMIN');
    const clientUsers = users.filter(u => u.role === 'CLIENT');
    
    console.log(`\nSummary:`);
    console.log(`- Admin users: ${adminUsers.length}`);
    console.log(`- Client users: ${clientUsers.length}`);
    console.log(`- Total users: ${users.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();