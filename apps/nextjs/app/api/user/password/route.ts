import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { findUserById, updateUser } from "@bmad-aigrowise/db";
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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password complexity
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: "New password does not meet complexity requirements",
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Check if user exists
    const existingUser = await findUserById(userId);

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, existingUser.password);
    
    if (isSamePassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    await updateUser(userId, {
      password: hashedPassword,
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
