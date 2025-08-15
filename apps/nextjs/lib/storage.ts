import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import mimeTypes from "mime-types";

interface UploadOptions {
  fileName?: string;
  contentType?: string;
  folder?: string;
}

interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

class DigitalOceanSpacesStorage {
  private s3Client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;
    
    this.s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: false, // Configures to use subdomain/virtual calling format.
    });
  }

  /**
   * Upload a file buffer to DigitalOcean Spaces
   */
  async uploadFile(
    buffer: Buffer, 
    options: UploadOptions = {}
  ): Promise<{ url: string; key: string; size: number }> {
    const fileExtension = options.fileName 
      ? options.fileName.split('.').pop()?.toLowerCase() || 'jpg'
      : 'jpg';
    
    const key = `${options.folder || 'images'}/${uuidv4()}.${fileExtension}`;
    
    const contentType = options.contentType || 
      mimeTypes.lookup(fileExtension) || 
      'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read', // Makes the file publicly accessible
      CacheControl: 'max-age=31536000', // Cache for 1 year
    });

    try {
      await this.s3Client.send(command);
      
      // Construct the public URL
      const url = `${this.endpoint}/${this.bucket}/${key}`;
      
      return {
        url,
        key,
        size: buffer.length,
      };
    } catch (error) {
      console.error('Error uploading file to DigitalOcean Spaces:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Delete a file from DigitalOcean Spaces
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from DigitalOcean Spaces:', error);
      throw new Error('Failed to delete file from storage');
    }
  }

  /**
   * Generate a presigned URL for temporary access to a private file
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Get the public URL for a file
   */
  getPublicUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }
}

// Initialize storage client with environment variables
const storageConfig: StorageConfig = {
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'nyc3',
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY || '',
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY || '',
  bucket: process.env.DO_SPACES_BUCKET || 'aigrowise-ndvi-images',
};

// Validate configuration
if (!storageConfig.accessKeyId || !storageConfig.secretAccessKey) {
  console.warn('DigitalOcean Spaces credentials not configured. File uploads will be disabled.');
}

export const storage = new DigitalOceanSpacesStorage(storageConfig);

export type { UploadOptions };