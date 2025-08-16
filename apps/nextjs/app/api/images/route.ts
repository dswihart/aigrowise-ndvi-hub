import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createImage, listImagesByUser } from "@bmad-aigrowise/db";
import { uploadToSpaces, getStorageConfig } from "../../../lib/storage/spaces";

// Configure upload directory for local storage fallback
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = session.user as any;
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
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

    // Validate file type
    const allowedTypes = ['image/tiff', 'image/tif', 'image/png', 'image/jpeg', 'image/jpg'];
    const isValidType = allowedTypes.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.tif') || 
                       file.name.toLowerCase().endsWith('.tiff');
    
    if (!isValidType) {
      return NextResponse.json(
        { error: "Invalid file type. Only TIFF, PNG, and JPEG files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 500MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `ndvi_${timestamp}_${Math.random().toString(36).substring(7)}${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let imageUrl: string;
    const storageConfig = getStorageConfig();

    if (storageConfig.useSpaces) {
      // Upload to DigitalOcean Spaces
      try {
        imageUrl = await uploadToSpaces(buffer, fileName, file.type);
        console.log('Image uploaded to Spaces:', imageUrl);
      } catch (error) {
        console.error('Spaces upload failed, falling back to local storage:', error);
        // Fallback to local storage
        await ensureUploadDir();
        const filePath = path.join(UPLOAD_DIR, fileName);
        await writeFile(filePath, buffer);
        imageUrl = `/uploads/${fileName}`;
      }
    } else {
      // Use local storage
      await ensureUploadDir();
      const filePath = path.join(UPLOAD_DIR, fileName);
      await writeFile(filePath, buffer);
      imageUrl = `/uploads/${fileName}`;
      console.log('Image uploaded to local storage:', imageUrl);
    }

    // Save image metadata to database
    const image = await createImage({
      url: imageUrl,
      userId: clientId,
      filename: fileName,
      title: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

    return NextResponse.json({
      success: true,
      image: {
        id: image.id,
        url: image.url,
        fileName: fileName,
        originalName: file.name,
        size: file.size,
        createdAt: image.createdAt,
      }
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const user = session.user as any;

    let images: any[] = [];
    
    if (user.role === "ADMIN") {
      // Admin can see all images or filter by client
      if (clientId) {
        images = await listImagesByUser(clientId, {
          orderBy: { createdAt: "desc" }
        });
      } else {
        // For admin without clientId, return empty array for now
        images = [];
      }
    } else {
      // Regular user can only see their own images
      images = await listImagesByUser(user.id, {
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json({
      images: images.map(img => ({
        id: img.id,
        url: img.url,
        fileName: img.fileName,
        title: img.title,
        fileSize: img.fileSize,
        mimeType: img.mimeType,
        createdAt: img.createdAt.toISOString()
      }))
    });

  } catch (error) {
    console.error("Fetch images error:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
