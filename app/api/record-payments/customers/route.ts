import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import prisma from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")

    if (!businessId) {
      return new NextResponse("Business ID is required", { status: 400 })
    }

    // Verify user has access to this business
    const _business = await prisma.business.findFirst({
      where: {
        id: businessId,
        BusinessUserRole: { some: { userId: session.user.id } },
      },
    })

    if (!_business) {
      return new NextResponse("Not found or unauthorized", { status: 404 })
    }

    // fetch customers with their pending invoices (and past history)
    const customers = await prisma.customer.findMany({
      where: {
        businessId,
        invoices: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        invoices: {
          where: {
            status: { in: ["SENT", "PARTIALLY_PAID"] },
          },
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
            dueDate: true,
          }
        }
      },
    })

    const transformed = customers.map(customer => {
      let totalOutstanding = 0;
      let hasOverdue = false;
      const count = customer.invoices.length;

      customer.invoices.forEach(inv => {
        const balance = Number(inv.totalAmount) - Number(inv.paidAmount);
        totalOutstanding += balance;
        if (inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== "PAID") {
          hasOverdue = true;
        }
      });

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        pendingInvoicesCount: count,
        totalOutstanding,
        hasOverdue
      }
    });

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("[RECORD_PAYMENTS_CUSTOMERS_GET]", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
