import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireBusinessAccess } from "@/lib/permissions";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // Check if user has access to this business
    await requireBusinessAccess(session.user.id, businessId);

    // Get business details with user role
    const businessRole = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId
        }
      },
      include: {
        business: true
      }
    });

    if (!businessRole) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get business statistics (placeholder for now)
    const stats = {
      totalUsers: await prisma.businessUserRole.count({
        where: { businessId }
      }),
      // TODO: Add more stats as we implement other features
      totalProducts: 0,
      totalCustomers: 0,
      totalInvoices: 0,
      monthlyRevenue: 0
    };

    // Get recent activity (placeholder for now)
    const recentActivity: any[] = [
      // TODO: Implement actual activity tracking
    ];

    return NextResponse.json({
      business: {
        ...businessRole.business,
        role: businessRole.role
      },
      stats,
      recentActivity
    }, { status: 200 });

  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}