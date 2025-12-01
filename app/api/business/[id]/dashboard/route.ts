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

    const { id: businessId } = await params;

    // Verify user has access to this business
    const userBusiness = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId,
        },
      },
    });

    if (!userBusiness) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all statistics in parallel
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalCustomers,
      totalProducts,
      invoices,
      thisMonthInvoices,
      recentInvoices,
      topCustomersData,
      activeSubscription
    ] = await Promise.all([
      // Total customers
      prisma.customer.count({
        where: { businessId },
      }),

      // Total products
      prisma.product.count({
        where: { businessId },
      }),

      // All invoices with totals
      prisma.invoice.findMany({
        where: { businessId },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
        },
      }),

      // This month's invoices
      prisma.invoice.count({
        where: {
          businessId,
          issueDate: {
            gte: firstDayOfMonth,
          },
        },
      }),

      // Last month's invoices for growth calculation - removed as unused

      // Recent invoices (last 5)
      prisma.invoice.findMany({
        where: { businessId },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      // Top customers by total spent
      prisma.customer.findMany({
        where: { businessId },
        select: {
          id: true,
          name: true,
          email: true,
          invoices: {
            where: {
              status: { not: "DRAFT" },
            },
            select: {
              totalAmount: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100, // Get more to calculate totals
      }),

      // Active Subscription
      prisma.subscription.findFirst({
        where: {
          businessId,
          status: "ACTIVE"
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

    // Calculate statistics from invoices
    const draftInvoices = invoices.filter(inv => inv.status === "DRAFT").length;
    const pendingInvoices = invoices.filter(inv => 
      inv.status === "SENT" || inv.status === "VIEWED" || inv.status === "PARTIAL_PAID"
    ).length;
    const paidInvoices = invoices.filter(inv => inv.status === "PAID").length;
    
    // Check for overdue invoices
    const overdueInvoices = invoices.filter(
      inv => (inv.status === "SENT" || inv.status === "VIEWED" || inv.status === "PARTIAL_PAID") && 
             inv.dueDate && 
             new Date(inv.dueDate) < now
    ).length;

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const paidRevenue = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const pendingRevenue = totalRevenue - paidRevenue;

    // Calculate this month's revenue
    const thisMonthInvoicesData = await prisma.invoice.findMany({
      where: {
        businessId,
        issueDate: {
          gte: firstDayOfMonth,
        },
      },
      select: {
        totalAmount: true,
      },
    });
    const thisMonthRevenue = thisMonthInvoicesData.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );

    // Calculate last month's revenue
    const lastMonthInvoicesData = await prisma.invoice.findMany({
      where: {
        businessId,
        issueDate: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth,
        },
      },
      select: {
        totalAmount: true,
      },
    });
    const lastMonthRevenue = lastMonthInvoicesData.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );

    // Calculate revenue growth
    let revenueGrowth = 0;
    if (lastMonthRevenue > 0) {
      revenueGrowth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (thisMonthRevenue > 0) {
      revenueGrowth = 100;
    }

    // Calculate customer growth (simplified - compare total customers with placeholder)
    const customerGrowth = 0; // Placeholder - would need historical tracking

    // Calculate average invoice value
    const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    // Process top customers
    const topCustomersWithTotals = topCustomersData
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email || "",
        totalSpent: customer.invoices.reduce(
          (sum: number, inv: { totalAmount: any }) => sum + Number(inv.totalAmount),
          0
        ),
        invoiceCount: customer.invoices.length,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    const stats = {
      totalCustomers,
      totalProducts,
      totalInvoices: invoices.length,
      draftInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      revenueGrowth,
      customerGrowth,
      avgInvoiceValue,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthInvoices,
      subscriptionPlan: activeSubscription?.plan || "FREE"
    };

    return NextResponse.json({
      stats,
      recentInvoices,
      topCustomers: topCustomersWithTotals,
    });
  } catch (error) {
    console.error("Error fetching business dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
