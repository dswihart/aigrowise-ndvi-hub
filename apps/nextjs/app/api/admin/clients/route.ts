import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { findUserByEmail, findUserById, updateUser } from "@bmad-aigrowise/db";
import { prisma } from "@bmad-aigrowise/db";
import bcrypt from "bcryptjs";

// Password validation utility
interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  // Minimum length check
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // Maximum length check (prevent very long passwords)
  if (password.length > 128) {
    errors.push("Password must be less than 128 characters long");
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)");
  }

  // Common password patterns to avoid
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i,
    /^welcome/i,
    /^login/i
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push("Password cannot contain common patterns like 'password', '123456', 'qwerty', etc.");
      break;
    }
  }

  // Sequential characters check (like abc, 123)
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password) ||
      /012|123|234|345|456|567|678|789/.test(password)) {
    errors.push("Password cannot contain sequential characters (abc, 123, etc.)");
  }

  // Repeated characters check (like aaa, 111)
  if (/(.)\\1{2,}/.test(password)) {
    errors.push("Password cannot contain more than 2 repeated characters in a row");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all clients with their image counts using direct Prisma query
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      include: { 
        _count: { 
          select: { images: true } 
        } 
      }
    });

    // Transform the response to include imageCount
    const transformedClients = clients.map(client => ({
      id: client.id,
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      imageCount: client._count?.images || 0,
      createdAt: client.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      clients: transformedClients,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: "Password does not meet complexity requirements",
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the new client with direct Prisma query to include firstName and lastName
    const newClient = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: "CLIENT",
      },
    });

    return NextResponse.json({
      success: true,
      client: {
        id: newClient.id,
        email: newClient.email,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        imageCount: 0,
        createdAt: newClient.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('id');

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Check if client exists and is actually a client
    const clientToDelete = await prisma.user.findUnique({
      where: { id: clientId },
      select: { 
        id: true, 
        role: true, 
        email: true,
        _count: {
          select: { images: true }
        }
      }
    });

    if (!clientToDelete) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (clientToDelete.role !== "CLIENT") {
      return NextResponse.json(
        { error: "User is not a client" },
        { status: 400 }
      );
    }

    // Delete all images associated with the client first
    if (clientToDelete._count.images > 0) {
      await prisma.image.deleteMany({
        where: { userId: clientId }
      });
    }

    // Delete the client
    await prisma.user.delete({
      where: { id: clientId }
    });

    return NextResponse.json({
      success: true,
      message: "Client and associated images deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}