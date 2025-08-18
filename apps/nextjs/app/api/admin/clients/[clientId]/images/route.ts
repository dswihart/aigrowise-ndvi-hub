import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { listImagesByUser } from "@bmad-aigrowise/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = params.clientId;

    // Fetch all images for this client using the database function
    const images = await listImagesByUser(clientId, {
      orderBy: { createdAt: "desc" },
      include: { user: true }
    });

    // Transform the response to match expected format
    const transformedImages = images.map(img => ({
      id: img.id,
      url: img.url,
      fileName: img.fileName,
      originalFileName: img.fileName, // Use fileName as originalFileName for now
      fileSize: img.fileSize,
      mimeType: img.mimeType,
      createdAt: img.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      images: transformedImages,
      clientEmail: "Client",
    });
  } catch (error) {
    console.error("Error fetching client images:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}