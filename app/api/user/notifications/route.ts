import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import db from "@/lib/db";
import { z } from "zod";

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  invoiceReminders: z.boolean(),
  paymentNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  securityAlerts: z.boolean()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, return default notification settings
    // In a real app, these would be stored in a UserSettings model
    const notifications = {
      emailNotifications: true,
      invoiceReminders: true,
      paymentNotifications: true,
      marketingEmails: false,
      securityAlerts: true
    };

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error("[USER_NOTIFICATIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const notifications = notificationsSchema.parse(body);

    // In a real app, you would save these to a UserSettings model
    // For now, we'll just validate and return success
    
    return NextResponse.json({
      success: true,
      notifications
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid notification data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[USER_NOTIFICATIONS_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}