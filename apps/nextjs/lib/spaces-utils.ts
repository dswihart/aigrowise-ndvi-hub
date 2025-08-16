import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Create S3 client for DigitalOcean Spaces
function createSpacesClient() {
  const accessKey = process.env.DO_SPACES_ACCESS_KEY;
  const secretKey = process.env.DO_SPACES_SECRET_KEY;
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const region = process.env.DO_SPACES_REGION || 'fra1';

  if (!accessKey || !secretKey || !endpoint) {
    throw new Error('DigitalOcean Spaces configuration missing');
  }

  return new S3Client({
    endpoint: endpoint,
    region: region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: false,
  });
}

// Generate signed URL for private object access
export async function generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const s3Client = createSpacesClient();
    const bucket = process.env.DO_SPACES_BUCKET;
    
    if (!bucket) {
      throw new Error('DO_SPACES_BUCKET not configured');
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    throw error;
  }
}

// Extract key from DigitalOcean Spaces URL
export function extractKeyFromUrl(url: string): string {
  const bucket = process.env.DO_SPACES_BUCKET;
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  
  if (!bucket || !endpoint) {
    throw new Error('DigitalOcean Spaces configuration missing');
  }

  // Handle both URL formats:
  // https://fra1.digitaloceanspaces.com/bucket-name/path/to/file
  // https://bucket-name.fra1.digitaloceanspaces.com/path/to/file
  
  if (url.includes(`/${bucket}/`)) {
    // Format: https://fra1.digitaloceanspaces.com/bucket-name/path/to/file
    return url.split(`/${bucket}/`)[1];
  } else if (url.includes(`${bucket}.`)) {
    // Format: https://bucket-name.fra1.digitaloceanspaces.com/path/to/file
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  }
  
  throw new Error(`Unable to extract key from URL: ${url}`);
}

// Generate signed URL from existing DigitalOcean Spaces URL
export async function getSignedUrlFromSpacesUrl(url: string, expiresIn: number = 3600): Promise<string> {
  try {
    const key = extractKeyFromUrl(url);
    return await generateSignedUrl(key, expiresIn);
  } catch (error) {
    console.error('❌ Error converting to signed URL:', error);
    // Fallback to original URL if signing fails
    return url;
  }
}