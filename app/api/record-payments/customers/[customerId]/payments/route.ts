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

    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          businessId,
          customerId: customerId,
        }
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            currency: true
          }
        },
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        paymentDate: "desc"
      }
    })

    const transformed = payments.map(p => ({
      id: p.id,
      amount: Number(p.amount),
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      reference: p.reference,
      notes: p.notes,
      invoiceNumber: p.invoice.invoiceNumber,
      currency: p.invoice.currency,
      createdBy: p.creator?.name || p.creator?.email || "Unknown"
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("[RECORD_PAYMENTS_PAYMENTS_GET]", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}