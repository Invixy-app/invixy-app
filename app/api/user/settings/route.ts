import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and settings
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        ...user,
        phone: '', // Would come from UserSettings model
        address: '', // Would come from UserSettings model
        timezone: 'UTC', // Would come from UserSettings model
        language: 'en' // Would come from UserSettings model
      },
      notifications: {
        emailNotifications: true,
        invoiceReminders: true,
        paymentNotifications: true,
        marketingEmails: false,
        securityAlerts: true
      }
    });

  } catch (error) {
    console.error("[USER_SETTINGS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}