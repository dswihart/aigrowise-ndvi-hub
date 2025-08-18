import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { findImageById, deleteImage, updateImage } from "@bmad-aigrowise/db";
import fs from "fs";
import path from "path";

export async function PUT(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const imageId = params.imageId;
    const { fileName, companyName, location, imageType } = await request.json();

    // Find the image first to check permissions
    const image = await findImageById(imageId);

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to update this image
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole !== "ADMIN" && image.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    // Validate image type
    const validImageTypes = ["NDVI", "NDRE", "GNDVI", "OSAVI", "CIred-edge", "CIgreen"];
    if (imageType && !validImageTypes.includes(imageType)) {
      return NextResponse.json(
        { success: false, error: "Invalid image type" },
        { status: 400 }
      );
    }

    // Update the image
    const updatedImage = await updateImage({
      id: imageId,
      fileName: fileName || image.fileName,
      companyName: companyName || null,
      location: location || null,
      imageType: imageType || "NDVI",
    });

    return NextResponse.json({
      success: true,
      message: "Image updated successfully",
      image: updatedImage,
    });
  } catch (error) {
    console.error("Error updating image:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const imageId = params.imageId;

    // Find the image first to get file path and check permissions
    const image = await findImageById(imageId);

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this image
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole !== "ADMIN" && image.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    // Delete the image from database first
    await deleteImage(imageId);

    // Try to delete the physical file if it's stored locally
    if (image.url && image.url.includes('/uploads/')) {
      try {
        const fileName = path.basename(image.url);
        const filePath = path.join(process.cwd(), 'uploads', fileName);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.warn("Could not delete physical file:", fileError);
        // Continue anyway - database deletion succeeded
      }
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
