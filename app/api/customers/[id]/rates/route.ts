import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: customerId } = await params;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // Verify user has access to this business
    const businessAccess = await prisma.businessUserRole.findFirst({
      where: {
        userId: session.user.id,
        businessId: businessId,
      },
    });

    if (!businessAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rates = await prisma.customerProductPrice.findMany({
      where: {
        businessId,
        customerId
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            price: true,
            unit: true,
          }
        }
      },
      orderBy: {
        product: {
          name: 'asc'
        }
      }
    });

    return NextResponse.json(rates);
  } catch (error) {
    console.error("Error fetching rates:", error);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}
