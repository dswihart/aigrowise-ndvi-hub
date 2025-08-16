import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getSignedUrlFromSpacesUrl } from "../../../../lib/spaces-utils";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await getSignedUrlFromSpacesUrl(url, 3600);

    return NextResponse.json({
      success: true,
      signedUrl: signedUrl,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    return NextResponse.json(
      { 
        error: "Failed to generate signed URL",
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