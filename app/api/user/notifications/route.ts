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

    const userSettings = await db.userSettings.findUnique({
      where: { userId: session.user.id }
    });

    const notifications = {
      emailNotifications: userSettings?.emailNotifications ?? true,
      invoiceReminders: userSettings?.invoiceReminders ?? true,
      paymentNotifications: userSettings?.paymentNotifications ?? true,
      marketingEmails: userSettings?.marketingEmails ?? false,
      securityAlerts: userSettings?.securityAlerts ?? true
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

    await db.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...notifications
      },
      update: {
        ...notifications
      }
    });
    
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