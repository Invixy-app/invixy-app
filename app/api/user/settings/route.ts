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
        image: true,
        settings: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        phone: user.settings?.phone || '',
        address: user.settings?.address || '',
        timezone: user.settings?.timezone || 'UTC',
        language: user.settings?.language || 'en'
      },
      notifications: {
        emailNotifications: user.settings?.emailNotifications ?? true,
        invoiceReminders: user.settings?.invoiceReminders ?? true,
        paymentNotifications: user.settings?.paymentNotifications ?? true,
        marketingEmails: user.settings?.marketingEmails ?? false,
        securityAlerts: user.settings?.securityAlerts ?? true
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