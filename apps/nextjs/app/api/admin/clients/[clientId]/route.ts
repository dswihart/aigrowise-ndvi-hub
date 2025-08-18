import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { findUserById, deleteUser, listImagesByUser, deleteImage } from "@bmad-aigrowise/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = params.clientId;

    // Check if client exists
    const existingClient = await findUserById(clientId);

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    if (existingClient.role !== "CLIENT") {
      return NextResponse.json(
        { success: false, error: "Cannot delete admin users" },
        { status: 400 }
      );
    }

    // First, delete all images belonging to this client
    const clientImages = await listImagesByUser(clientId);
    
    // Delete each image
    for (const image of clientImages) {
      await deleteImage(image.id);
    }

    // Now delete the client (no foreign key constraints remain)
    await deleteUser(clientId);

    return NextResponse.json({
      success: true,
      message: `Client and ${clientImages.length} associated images deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}