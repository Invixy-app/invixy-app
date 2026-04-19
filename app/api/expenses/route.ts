import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";
import { ExpenseStatus, PaymentMethod } from "@prisma/client";

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

    const expenses = await prisma.expense.findMany({
      where: { businessId },
      include: {
        category: true,
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { date: "desc" }
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      businessId, 
      categoryId, 
      amount, 
      currency,
      date, 
      description,
      paymentMethod,
      reference,
      status
    } = body;

    if (!businessId || amount === undefined || !description) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
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

    const expense = await prisma.expense.create({
      data: {
        businessId,
        categoryId: categoryId || null,
        amount,
        currency: currency || "USD",
        date: date ? new Date(date) : new Date(),
        description,
        paymentMethod: paymentMethod as PaymentMethod || "CASH",
        reference,
        status: status as ExpenseStatus || "COMPLETED",
        createdBy: session.user.id
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
