import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain uppercase, lowercase, number and special character")
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = passwordChangeSchema.parse(body);

    // Get current user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has a password (might be using OAuth)
    if (!user.password) {
      return NextResponse.json({ 
        error: "Cannot change password for OAuth accounts" 
      }, { status: 400 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: "Current password is incorrect" 
      }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword }
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid password data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[USER_PASSWORD_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}