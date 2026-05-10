import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";
import { ExpenseStatus, PaymentMethod } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: expenseId } = await params;
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

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId, businessId }
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: expenseId } = await params;
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

    if (!hasAccess || hasAccess.role === 'VIEWER') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const expense = await prisma.expense.update({
      where: { id: expenseId, businessId },
      data: {
        categoryId: categoryId || null,
        amount,
        currency,
        date: date ? new Date(date) : undefined,
        description,
        paymentMethod: paymentMethod as PaymentMethod,
        reference,
        status: status as ExpenseStatus
      }
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: expenseId } = await params;
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

    if (!hasAccess || hasAccess.role === 'VIEWER') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.expense.delete({
      where: { id: expenseId, businessId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
