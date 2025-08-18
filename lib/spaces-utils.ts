import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const spacesClient = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY || '',
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'aigrowise-ndvi-images';

export async function uploadToSpaces(file: Buffer, fileName: string, contentType: string = 'image/jpeg'): Promise<string> {
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read' as const,
  };

  try {
    await spacesClient.send(new PutObjectCommand(uploadParams));
    return `${process.env.DO_SPACES_ENDPOINT}/${BUCKET_NAME}/${fileName}`;
  } catch (error) {
    console.error('Error uploading to DigitalOcean Spaces:', error);
    throw error;
  }
}

export async function getSignedUploadUrl(fileName: string, contentType: string = 'image/jpeg'): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
    ACL: 'public-read' as const,
  });

  try {
    const signedUrl = await getSignedUrl(spacesClient, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}

export async function getSignedDownloadUrl(fileName: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  try {
    const signedUrl = await getSignedUrl(spacesClient, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed download URL:', error);
    throw error;
  }
}
