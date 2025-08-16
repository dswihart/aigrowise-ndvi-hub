import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { createImage, findUserByEmail } from "../../../../lib/db";
import { processImage } from "../../../../lib/image-processor";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = 'nodejs';
export const maxDuration = 60;

async function parseFormData(request: NextRequest): Promise<{ fields: Record<string, string>; file: { buffer: Buffer; name: string; type: string; size: number } | null }> {
  try {
    const formData = await request.formData();
    const fields: Record<string, string> = {};
    let file: { buffer: Buffer; name: string; type: string; size: number } | null = null;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const arrayBuffer = await value.arrayBuffer();
        file = {
          buffer: Buffer.from(arrayBuffer),
          name: value.name,
          type: value.type,
          size: value.size,
        };
      } else {
        fields[key] = value.toString();
      }
    }

    return { fields, file };
  } catch (error) {
    console.error('Error parsing form data:', error);
    throw new Error('Failed to parse form data');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Processing image upload request...");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("❌ No valid session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      console.log("❌ User is not admin:", userRole);
      return NextResponse.json(
        { error: "Admin access required for image uploads" },
        { status: 403 }
      );
    }

    console.log("✅ Admin user authenticated");

    const { fields, file } = await parseFormData(request);
    
    const clientEmail = fields.clientEmail;
    
    if (!clientEmail) {
      console.log("❌ No client email provided");
      return NextResponse.json(
        { error: "Client email is required" },
        { status: 400 }
      );
    }

    console.log("📧 Client email:", clientEmail);

    const client = await findUserByEmail(clientEmail);
    if (!client) {
      console.log("❌ Client not found:", clientEmail);
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (client.role !== "CLIENT") {
      console.log("❌ User is not a client:", client.role);
      return NextResponse.json(
        { error: "User is not a client" },
        { status: 400 }
      );
    }

    console.log("✅ Client found:", client.id);

    if (!file) {
      console.log("❌ No file uploaded");
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      console.log("❌ File too large:", file.size);
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    const allowedMimeTypes = [
      'image/tiff',
      'image/tif', 
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/octet-stream',
      'application/x-hdf',
    ];
    
    const allowedExtensions = /\.(tiff?|geotiff?|png|jpe?g|bil|bip|bsq|img|hdf|h5)$/i;
    
    const isValidMimeType = allowedMimeTypes.includes(file.type);
    const isValidExtension = allowedExtensions.test(file.name.toLowerCase());
    
    if (!isValidMimeType && !isValidExtension) {
      console.log("❌ Invalid file type:", file.type, file.name);
      return NextResponse.json(
        { error: "Invalid file type. Please upload TIFF, GeoTIFF, PNG, JPEG, or other supported NDVI image formats." },
        { status: 400 }
      );
    }

    console.log("📁 File validated:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Direct environment variable access
    const accessKey = process.env.DO_SPACES_ACCESS_KEY;
    const secretKey = process.env.DO_SPACES_SECRET_KEY;
    const bucket = process.env.DO_SPACES_BUCKET;
    const endpoint = process.env.DO_SPACES_ENDPOINT;
    const region = process.env.DO_SPACES_REGION || 'fra1';

    console.log("Environment check:", {
      accessKey: accessKey ? 'Present' : 'Missing',
      secretKey: secretKey ? 'Present' : 'Missing', 
      bucket: bucket || 'Missing',
      endpoint: endpoint || 'Missing',
      region: region
    });

    if (!accessKey || !secretKey || !bucket || !endpoint) {
      console.log("❌ Missing DigitalOcean Spaces configuration");
      return NextResponse.json(
        { error: "DigitalOcean Spaces configuration missing" },
        { status: 500 }
      );
    }

    // Create S3 client with minimal configuration
    const s3Client = new S3Client({
      endpoint: endpoint,
      region: region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: false,
    });

    console.log("☁️ Uploading to DigitalOcean Spaces...");
    
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fileName = `ndvi_${timestamp}_${randomSuffix}.${file.name.split('.').pop()}`;
    const key = `clients/${client.id}/originals/${fileName}`;

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.type,
        ACL: 'public-read',
      });

      const result = await s3Client.send(uploadCommand);
      console.log("✅ Upload successful:", result);

      const fileUrl = `${endpoint}/${bucket}/${key}`;
      console.log("📍 File URL:", fileUrl);

      // Create image record in database
      console.log("💾 Creating database record...");
      
      const image = await createImage({
        url: fileUrl,
        originalFileName: file.name,
        fileName: fileName,
        fileSize: file.size,
        mimeType: file.type,
        processingStatus: "completed",
        userId: client.id,
      });

      console.log("✅ Database record created:", image.id);

      return NextResponse.json({
        success: true,
        message: "Image uploaded successfully",
        image: {
          id: image.id,
          url: image.url,
          clientEmail: client.email,
          createdAt: image.createdAt,
          metadata: {
            originalFileName: image.originalFileName,
            fileSize: image.fileSize,
            mimeType: image.mimeType,
          },
        },
      });

    } catch (uploadError) {
      console.error("❌ DigitalOcean Spaces upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to DigitalOcean Spaces. Please check configuration." },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("❌ Image upload error:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload image", 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
