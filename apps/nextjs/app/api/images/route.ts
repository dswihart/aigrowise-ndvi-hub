import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createImage, listImagesByUser, listAllImages } from "@bmad-aigrowise/db";
import { uploadToSpaces } from "../../../lib/spaces-upload";

// Configure for large file uploads
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large file uploads

// Configure upload directory for local storage fallback
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Check if file is TIF
function isTifFile(fileName: string, mimeType?: string): boolean {
  const lowerFileName = fileName.toLowerCase();
  const isTif = lowerFileName.endsWith('.tif') || lowerFileName.endsWith('.tiff');
  const isTifMime = mimeType?.includes('tiff') || mimeType?.includes('tif');
  return isTif || isTifMime;
}

// Convert TIF to high-quality JPEG with better error handling
async function convertTifToJpeg(buffer: Buffer, originalFileName: string): Promise<{jpegBuffer: Buffer, jpegFileName: string}> {
  const sharp = (await import('sharp')).default;
  
  console.log(`🔄 Converting TIF to JPEG: ${originalFileName} (${Math.round(buffer.length / 1024 / 1024)}MB)`);
  
  try {
    // Check file size - if too large, resize it down first
    const maxSize = 100 * 1024 * 1024; // 100MB limit for processing
    if (buffer.length > maxSize) {
      console.log(`⚠️  Large file detected, pre-processing: ${originalFileName}`);
      
      // Pre-process large files by resizing them first
      const resizedBuffer = await sharp(buffer)
        .resize(4000, 4000, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .tiff({ compression: 'lzw' })
        .toBuffer();
      
      console.log(`✅ Pre-processed size: ${Math.round(resizedBuffer.length / 1024 / 1024)}MB`);
      buffer = resizedBuffer;
    }
    
    // Convert TIF to JPEG with high quality but safer settings
    const jpegBuffer = await sharp(buffer)
      .jpeg({ 
        quality: 95,              // High quality but not maximum (reduces memory usage)
        progressive: true,        // Progressive JPEG
        optimizeScans: true,      // Optimize for smaller size
        mozjpeg: false           // Use standard JPEG encoder (more stable)
      })
      .toBuffer();
    
    // Generate JPEG filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const jpegFileName = `ndvi_${timestamp}_${randomSuffix}.jpg`;
    
    console.log(`✅ TIF converted to JPEG: ${jpegFileName} (${Math.round(jpegBuffer.length / 1024 / 1024)}MB)`);
    
    return { jpegBuffer, jpegFileName };
    
  } catch (error) {
    console.error(`❌ TIF conversion failed for ${originalFileName}:`, error);
    throw new Error(`TIF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clientId = formData.get("clientId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Check file size limits
    const maxFileSize = 200 * 1024 * 1024; // 200MB limit
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let finalBuffer = buffer;
    let finalFileName: string;
    let finalMimeType = file.type;
    let wasConverted = false;
    let conversionError = null;

    // Check if this is a TIF file and convert it
    if (isTifFile(file.name, file.type)) {
      try {
        const converted = await convertTifToJpeg(buffer, file.name);
        finalBuffer = converted.jpegBuffer;
        finalFileName = converted.jpegFileName;
        finalMimeType = 'image/jpeg';
        wasConverted = true;
      } catch (error) {
        console.error("❌ TIF conversion failed, uploading original:", error);
        conversionError = error instanceof Error ? error.message : 'Unknown conversion error';
        
        // Fall back to original file if conversion fails
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const fileExtension = path.extname(file.name);
        finalFileName = "ndvi_" + timestamp + "_" + randomSuffix + fileExtension;
      }
    } else {
      // For non-TIF files, use original filename pattern
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const fileExtension = path.extname(file.name);
      finalFileName = "ndvi_" + timestamp + "_" + randomSuffix + fileExtension;
    }

    let imageUrl: string;

    // Upload to DigitalOcean Spaces
    try {
      imageUrl = await uploadToSpaces(finalFileName, finalBuffer, finalMimeType);
      console.log(`📤 File uploaded to Spaces: ${imageUrl}${wasConverted ? ' (converted from TIF)' : ''}`);
    } catch (error) {
      console.error("Spaces upload failed, falling back to local storage:", error);
      // Fallback to local storage
      await ensureUploadDir();
      const filePath = path.join(UPLOAD_DIR, finalFileName);
      await writeFile(filePath, finalBuffer);
      imageUrl = "/uploads/" + finalFileName;
    }

    // Save image metadata to database
    const image = await createImage({
      url: imageUrl,
      userId: clientId,
      fileName: finalFileName,
      originalFileName: file.name, // Keep original filename for reference
      fileSize: finalBuffer.length, // Use final file size
      mimeType: finalMimeType,
    });

    return NextResponse.json({
      success: true,
      converted: wasConverted,
      conversionError: conversionError,
      image: {
        id: image.id,
        url: image.url,
        filename: finalFileName,
        originalName: file.name,
        size: finalBuffer.length,
        mimeType: finalMimeType,
        createdAt: image.createdAt.toISOString(),
        converted: wasConverted
      }
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { 
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    let images;

    if (userRole === "ADMIN") {
      images = await listAllImages();
    } else {
      images = await listImagesByUser(session.user.id);
    }

    const transformedImages = images.map(img => ({
      id: img.id,
      url: img.url,
      fileName: img.fileName,
      originalFileName: img.originalFileName || img.fileName,
      fileSize: img.fileSize,
      mimeType: img.mimeType,
      createdAt: img.createdAt.toISOString(),
      user: img.user ? { email: img.user.email } : undefined,
    }));

    return NextResponse.json({
      success: true,
      images: transformedImages,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}