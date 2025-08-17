import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    // Verify client exists
    const client = await prisma.user.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    // Fetch all images for this client
    const images = await prisma.image.findMany({
      where: { userId: clientId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        originalFileName: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      images,
      clientEmail: client.email,
    });
  } catch (error) {
    console.error("Error fetching client images:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
