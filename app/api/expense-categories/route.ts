import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const hasAccess = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId
        }
      }
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const categories = await prisma.expenseCategory.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, businessId } = body;

    if (!name || !businessId) {
      return NextResponse.json({ error: "Name and Business ID are required" }, { status: 400 });
    }

    const hasAccess = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId
        }
      }
    });

    if (!hasAccess || hasAccess.role === 'VIEWER') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name,
        description,
        businessId
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating expense category:", error);
    
    // Check for unique constraint violation (duplicate category name)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
