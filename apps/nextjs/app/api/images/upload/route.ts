import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { createImage, findUserByEmail } from "../../../../lib/db";
import { storage } from "../../../../lib/storage";
import { processImage } from "../../../../lib/image-processor";
import formidable from "formidable";
import { Readable } from "stream";

// Configure Next.js to handle file uploads
export const runtime = 'nodejs';

// Helper function to convert NextRequest to Node.js readable stream
async function convertRequestToFormData(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Content type must be multipart/form-data');
  }

  // Get the raw body as ArrayBuffer and convert to Buffer
  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Create a readable stream from the buffer
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB max file size
      allowEmptyFiles: false,
      keepExtensions: true,
    });

    // Parse the stream
    form.parse(stream as any, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin (only admins can upload for clients)
    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required for image uploads" },
        { status: 403 }
      );
    }

    // Parse the multipart form data
    const { fields, files } = await convertRequestToFormData(request);
    
    const clientEmail = Array.isArray(fields.clientEmail) 
      ? fields.clientEmail[0] 
      : fields.clientEmail;
    
    if (!clientEmail || typeof clientEmail !== 'string') {
      return NextResponse.json(
        { error: "Client email is required" },
        { status: 400 }
      );
    }

    // Find the client user
    const client = await findUserByEmail(clientEmail);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (client.role !== "CLIENT") {
      return NextResponse.json(
        { error: "User is not a client" },
        { status: 400 }
      );
    }

    // Get the uploaded file
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!uploadedFile) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Read the file buffer
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    
    // Clean up the temporary file
    fs.unlinkSync(uploadedFile.filepath);

    // Process the image (create thumbnails, optimize, etc.)
    const processedImages = await processImage(fileBuffer, {
      originalFileName: uploadedFile.originalFilename || 'image',
      mimeType: uploadedFile.mimetype || 'application/octet-stream',
    });

    // Upload original image to DigitalOcean Spaces
    const originalUpload = await storage.uploadFile(fileBuffer, {
      fileName: uploadedFile.originalFilename || 'image.jpg',
      contentType: uploadedFile.mimetype || undefined,
      folder: `clients/${client.id}/originals`,
    });

    // Upload processed images
    const thumbnailUpload = processedImages.thumbnail ? 
      await storage.uploadFile(processedImages.thumbnail, {
        fileName: `thumb_${uploadedFile.originalFilename || 'image.jpg'}`,
        contentType: 'image/jpeg',
        folder: `clients/${client.id}/thumbnails`,
      }) : null;

    const optimizedUpload = processedImages.optimized ? 
      await storage.uploadFile(processedImages.optimized, {
        fileName: `opt_${uploadedFile.originalFilename || 'image.jpg'}`,
        contentType: 'image/jpeg',
        folder: `clients/${client.id}/optimized`,
      }) : null;

    // Create image record in database
    const image = await createImage({
      url: originalUpload.url,
      thumbnailUrl: thumbnailUpload?.url,
      optimizedUrl: optimizedUpload?.url,
      originalFileName: uploadedFile.originalFilename || null,
      fileName: originalUpload.key.split('/').pop() || null,
      fileSize: uploadedFile.size || null,
      mimeType: uploadedFile.mimetype || null,
      width: processedImages.metadata?.width,
      height: processedImages.metadata?.height,
      format: processedImages.metadata?.format,
      channels: processedImages.metadata?.channels,
      colorspace: processedImages.metadata?.space,
      hasAlpha: processedImages.metadata?.hasAlpha || false,
      compressionRatio: processedImages.compressionRatio,
      isProcessed: true,
      processingStatus: "completed",
      userId: client.id,
    });

    return NextResponse.json({
      success: true,
      image: {
        id: image.id,
        url: image.url,
        thumbnailUrl: image.thumbnailUrl,
        optimizedUrl: image.optimizedUrl,
        clientEmail: client.email,
        createdAt: image.createdAt,
        metadata: {
          originalFileName: image.originalFileName,
          fileSize: image.fileSize,
          mimeType: image.mimeType,
          dimensions: image.width && image.height ? `${image.width}x${image.height}` : null,
          format: image.format,
        },
      },
    });

  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}