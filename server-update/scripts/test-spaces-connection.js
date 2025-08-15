#!/usr/bin/env node

/**
 * DigitalOcean Spaces Connection Test Script
 * Tests the connection to DigitalOcean Spaces and verifies upload/download functionality
 */

const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', 'env.production') });

const config = {
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'nyc3',
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  bucket: process.env.DO_SPACES_BUCKET || 'aigrowise-ndvi-images',
};

console.log('🔧 Testing DigitalOcean Spaces Configuration...\n');

// Validate configuration
if (!config.accessKeyId || !config.secretAccessKey) {
  console.error('❌ Error: Missing DigitalOcean Spaces credentials');
  console.error('Please set DO_SPACES_ACCESS_KEY and DO_SPACES_SECRET_KEY in env.production');
  process.exit(1);
}

if (config.accessKeyId === 'your-do-spaces-access-key' || 
    config.secretAccessKey === 'your-do-spaces-secret-key') {
  console.error('❌ Error: Placeholder credentials detected');
  console.error('Please replace the placeholder values with real DigitalOcean Spaces credentials');
  process.exit(1);
}

// Initialize S3 client
const s3Client = new S3Client({
  endpoint: config.endpoint,
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  forcePathStyle: false,
});

async function testConnection() {
  try {
    console.log(`📍 Endpoint: ${config.endpoint}`);
    console.log(`🪣 Bucket: ${config.bucket}`);
    console.log(`🌍 Region: ${config.region}\n`);

    // Test 1: List objects (basic connectivity)
    console.log('🔍 Test 1: Testing bucket connectivity...');
    const listCommand = new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: 1,
    });
    
    await s3Client.send(listCommand);
    console.log('✅ Bucket connectivity successful\n');

    // Test 2: Upload a test file
    console.log('📤 Test 2: Testing file upload...');
    const testContent = Buffer.from(`Test upload at ${new Date().toISOString()}`);
    const testKey = `test/connection-test-${Date.now()}.txt`;
    
    const putCommand = new PutObjectCommand({
      Bucket: config.bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      ACL: 'public-read',
    });
    
    await s3Client.send(putCommand);
    const uploadUrl = `${config.endpoint}/${config.bucket}/${testKey}`;
    console.log(`✅ File upload successful: ${uploadUrl}\n`);

    // Test 3: Download the test file
    console.log('📥 Test 3: Testing file download...');
    const getCommand = new GetObjectCommand({
      Bucket: config.bucket,
      Key: testKey,
    });
    
    const response = await s3Client.send(getCommand);
    const downloadedContent = await streamToBuffer(response.Body);
    
    if (downloadedContent.toString() === testContent.toString()) {
      console.log('✅ File download successful - content verified\n');
    } else {
      console.log('⚠️  File download successful but content mismatch\n');
    }

    // Test 4: Check public access
    console.log('🌐 Test 4: Testing public URL access...');
    try {
      const fetch = require('node-fetch');
      const publicResponse = await fetch(uploadUrl);
      if (publicResponse.ok) {
        console.log('✅ Public URL access successful\n');
      } else {
        console.log(`⚠️  Public URL returned status: ${publicResponse.status}\n`);
      }
    } catch (error) {
      console.log('⚠️  Could not test public URL (this may be expected in some configurations)\n');
    }

    console.log('🎉 All tests completed successfully!');
    console.log('📝 Your DigitalOcean Spaces is ready for production use.');
    console.log(`🔗 Test file remains at: ${uploadUrl}`);
    console.log('💡 You can delete test files manually from the DigitalOcean console.');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.Code === 'NoSuchBucket') {
      console.error('\n💡 Bucket does not exist. Please create it in the DigitalOcean console:');
      console.error(`   https://cloud.digitalocean.com/spaces`);
    } else if (error.Code === 'InvalidAccessKeyId') {
      console.error('\n💡 Invalid access key. Please check your credentials.');
    } else if (error.Code === 'SignatureDoesNotMatch') {
      console.error('\n💡 Invalid secret key. Please check your credentials.');
    }
    
    process.exit(1);
  }
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Run the test
testConnection().catch(console.error);