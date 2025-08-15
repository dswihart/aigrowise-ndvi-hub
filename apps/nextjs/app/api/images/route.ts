import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createImage, listImagesByUser } from "@bmad-aigrowise/db";
import type { Image } from "@prisma/client";

// Configure upload directory
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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if ((session.user as any).role !== "ADMIN") {
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
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.tif') && !file.name.toLowerCase().endsWith('.tiff')) {
      return NextResponse.json(
        { error: "Invalid file type. Only TIFF, PNG, and JPEG files are allowed." },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `ndvi_${timestamp}_${Math.random().toString(36).substring(7)}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create public URL for the image
    const imageUrl = `/uploads/${fileName}`;

    // Save image metadata to database
    const image = await createImage({
      url: imageUrl,
      userId: clientId,
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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    let images: Image[];
    
    if ((session.user as any).role === "ADMIN") {
      // Admin can see all images or filter by client
      if (clientId) {
        images = await listImagesByUser(clientId, {
          orderBy: { createdAt: "desc" }
        });
      } else {
        // For admin without clientId, we need a different function to get all images
        // For now, return empty array - this can be enhanced later
        images = [];
      }
    } else {
      // Regular user can only see their own images
      images = await listImagesByUser(session.user.id, {
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json({
      images: images.map(img => ({
        id: img.id,
        url: img.url,
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