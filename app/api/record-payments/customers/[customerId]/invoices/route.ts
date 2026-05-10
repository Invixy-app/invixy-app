import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import prisma from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")

    if (!businessId) {
      return new NextResponse("Business ID is required", { status: 400 })
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        businessId,
        customerId: customerId,
        status: { in: ["SENT", "PARTIALLY_PAID"] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        issueDate: true,
        dueDate: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        currency: true,
      },
      orderBy: {
        issueDate: "desc"
      }
    })

    const transformed = invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      balanceDue: Number(inv.totalAmount) - Number(inv.paidAmount),
      status: inv.status,
      currency: inv.currency,
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("[RECORD_PAYMENTS_INVOICES_GET]", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
