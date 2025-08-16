import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const spacesClient = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://fra1.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'fra1',
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY || '',
  },
  forcePathStyle: false, // Important for DigitalOcean Spaces
});

export async function uploadToSpaces(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const bucketName = process.env.DO_SPACES_BUCKET || 'aigrowise-ndvi-images';
  const region = process.env.DO_SPACES_REGION || 'fra1';
  const endpoint = process.env.DO_SPACES_ENDPOINT || 'https://fra1.digitaloceanspaces.com';
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: file,
    ContentType: mimeType,});

  try {
    console.log(`Uploading ${fileName} to Spaces bucket ${bucketName}`);
    await spacesClient.send(command);
    
    // Construct the public URL correctly for DigitalOcean Spaces
    const publicUrl = `https://${bucketName}.${region}.digitaloceanspaces.com/${fileName}`;
    console.log(`Successfully uploaded to: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('Upload to Spaces failed:', error);
    throw new Error(`Failed to upload image to cloud storage: ${(error as Error).message}`);
  }
}

export function getStorageConfig() {
  const hasCredentials = !!(process.env.DO_SPACES_ACCESS_KEY && process.env.DO_SPACES_SECRET_KEY);
  console.log('Storage config - Spaces available:', hasCredentials);
  
  return {
    useSpaces: hasCredentials,
    bucket: process.env.DO_SPACES_BUCKET || 'aigrowise-ndvi-images',
    endpoint: process.env.DO_SPACES_ENDPOINT || 'https://fra1.digitaloceanspaces.com',
    region: process.env.DO_SPACES_REGION || 'fra1',
  };
}
