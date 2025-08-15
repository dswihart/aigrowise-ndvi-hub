const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestImages() {
  try {
    // Find the test client
    const client = await prisma.user.findUnique({
      where: { email: 'client@example.com' }
    });
    
    if (!client) {
      console.log('Test client not found');
      return;
    }
    
    // Create some test NDVI images
    const testImages = [
      {
        url: 'https://example.com/ndvi1.jpg',
        userId: client.id,
        originalFileName: 'field_ndvi_2025_01.jpg',
        mimeType: 'image/jpeg'
      },
      {
        url: 'https://example.com/ndvi2.jpg',
        userId: client.id,
        originalFileName: 'field_ndvi_2025_02.jpg',
        mimeType: 'image/jpeg'
      },
      {
        url: 'https://example.com/ndvi3.jpg',
        userId: client.id,
        originalFileName: 'field_ndvi_2025_03.jpg',
        mimeType: 'image/jpeg'
      }
    ];
    
    for (const imageData of testImages) {
      const image = await prisma.image.create({
        data: imageData
      });
      console.log('Created test image:', image.id);
    }
    
    console.log('Test images created successfully');
  } catch (error) {
    console.error('Error creating test images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestImages();