import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import db from "@/lib/db";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional()
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address, timezone, language } = profileUpdateSchema.parse(body);

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
        // Note: phone, address, timezone, language would need to be added to User model
        // For now, we'll just update the name
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[USER_PROFILE_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}