import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { findUserByEmail, findUserById } from "@bmad-aigrowise/db";
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
  if (/(.)\1{2,}/.test(password)) {
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

    // Fetch all admin users
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform the response
    const transformedAdmins = admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      createdAt: admin.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      admins: transformedAdmins,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
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

    // Create the new admin user
    const newAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        createdAt: newAdmin.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error);
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
    const adminId = searchParams.get('id');

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (adminId === (session.user as any).id) {
      return NextResponse.json(
        { error: "Cannot delete your own admin account" },
        { status: 400 }
      );
    }

    // Check if admin exists and is actually an admin
    const adminToDelete = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, email: true }
    });

    if (!adminToDelete) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    if (adminToDelete.role !== "ADMIN") {
      return NextResponse.json(
        { error: "User is not an admin" },
        { status: 400 }
      );
    }

    // Check if this is the last admin (prevent system lockout)
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" }
    });

    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin user" },
        { status: 400 }
      );
    }

    // Delete the admin
    await prisma.user.delete({
      where: { id: adminId }
    });

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}