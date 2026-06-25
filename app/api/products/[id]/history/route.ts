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

    // Await params before accessing properties
    const { id: productId } = await params;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const businessId = searchParams.get("businessId");

    if (!customerId || !businessId) {
      return NextResponse.json(
        { error: "Customer ID and Business ID are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this business
    const businessAccess = await prisma.businessUserRole.findFirst({
      where: {
        userId: session.user.id,
        businessId: businessId,
      },
    });

    if (!businessAccess) {
      return NextResponse.json(
        { error: "You don't have access to this business" },
        { status: 403 }
      );
    }

    // Check for specifically negotiated custom price first
    const customPrice = await prisma.customerProductPrice.findUnique({
      where: {
        customerId_productId: {
          customerId: customerId,
          productId: productId
        }
      }
    });

    // Get the last invoice that included this product for this customer
    // Exclude draft invoices to get actual transaction history
    const lastInvoiceItem = await prisma.invoiceItem.findFirst({
      where: {
        productId: productId,
        invoice: {
          customerId: customerId,
          businessId: businessId,
          status: {
            not: "DRAFT"
          }
        }
      },
      select: {
        unitPrice: true,
        quantity: true,
        discount: true,
        invoice: {
          select: {
            invoiceNumber: true,
            issueDate: true,
            status: true
          }
        }
      },
      orderBy: {
        invoice: {
          issueDate: "desc"
        }
      }
    });

    if (!lastInvoiceItem && !customPrice) {
      return NextResponse.json({
        hasHistory: false,
        lastPrice: null
      });
    }

    return NextResponse.json({
      hasHistory: !!lastInvoiceItem || !!customPrice,
      lastPrice: customPrice ? Number(customPrice.price) : (lastInvoiceItem ? Number(lastInvoiceItem.unitPrice) : null),
      lastQuantity: lastInvoiceItem ? Number(lastInvoiceItem.quantity) : undefined,
      lastDiscount: lastInvoiceItem ? Number(lastInvoiceItem.discount) : undefined,
      lastInvoice: lastInvoiceItem ? {
        number: lastInvoiceItem.invoice.invoiceNumber,
        date: lastInvoiceItem.invoice.issueDate,
        status: lastInvoiceItem.invoice.status
      } : undefined
    });

  } catch (error) {
    console.error("Error fetching product history:", error);
    return NextResponse.json(
      { error: "Failed to fetch product history" },
      { status: 500 }
    );
  }
}
