import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { switchUserBusiness } from "@/lib/business";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { businessId } = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // Verify user has access to this business and get business details
    const businessAccess = await switchUserBusiness(session.user.id, businessId);

    if (!businessAccess) {
      return NextResponse.json({ error: "Access denied to this business" }, { status: 403 });
    }

    return NextResponse.json({
      message: "Business switched successfully",
      business: {
        id: businessAccess.business.id,
        name: businessAccess.business.name,
        role: businessAccess.role
      }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}