import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || "https://fra1.digitaloceanspaces.com",
  region: process.env.DO_SPACES_REGION || "fra1",
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || "",
    secretAccessKey: process.env.DO_SPACES_SECRET || "",
  },
  forcePathStyle: false,
});

export async function uploadToSpaces(
  fileName: string,
  buffer: Buffer,
  contentType: string = "application/octet-stream"
): Promise<string> {
  const bucket = process.env.DO_SPACES_BUCKET || "aigrowise-ndvi-images";
  
  // Upload to Spaces
  const uploadCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: `uploads/${fileName}`,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read",
  });

  await s3Client.send(uploadCommand);
  
  // Return the public URL in correct DigitalOcean Spaces format
  const publicUrl = `https://${bucket}.fra1.digitaloceanspaces.com/uploads/${fileName}`;
  
  console.log("✅ Uploaded to Spaces:", publicUrl);
  return publicUrl;
}

export async function uploadChunkToSpaces(
  fileName: string,
  buffer: Buffer,
  contentType: string = "application/octet-stream"
): Promise<string> {
  // Same as uploadToSpaces but can be customized for chunks if needed
  return uploadToSpaces(fileName, buffer, contentType);
}
