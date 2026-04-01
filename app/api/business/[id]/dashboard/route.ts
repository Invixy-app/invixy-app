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

    // Date filter
    const fromParam = request.nextUrl.searchParams.get("from");
    const toParam = request.nextUrl.searchParams.get("to");
    const hasDateFilter = !!(fromParam || toParam);
    let dateFilter = {};
    if (hasDateFilter) {
      dateFilter = {
        issueDate: {
          ...(fromParam ? { gte: new Date(fromParam) } : {}),
          ...(toParam ? { lte: new Date(`${toParam}T23:59:59.999Z`) } : {}),
        }
      };
    }

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
        where: { businessId, ...dateFilter },
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
          ...(hasDateFilter ? dateFilter : { issueDate: { gte: firstDayOfMonth } })
        },
      }),

      // Last month's invoices for growth calculation - removed as unused

      // Recent invoices (last 5)
      prisma.invoice.findMany({
        where: { businessId, ...dateFilter },
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
              status: { in: ["SENT", "PAID"] },
              ...dateFilter
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

    const toNumber = (value: unknown): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const openStatuses = new Set(["SENT"]);
    const bookedStatuses = new Set(["SENT", "PAID"]);

    // Calculate statistics from invoices
    const draftInvoices = invoices.filter(inv => inv.status === "DRAFT").length;
    const pendingInvoices = invoices.filter(inv => inv.status === "SENT").length;
    const paidInvoices = invoices.filter(inv => inv.status === "PAID").length;
    const overdueInvoices = 0;

    const bookedInvoices = invoices.filter(inv => bookedStatuses.has(inv.status));
    const openInvoices = invoices.filter(inv => openStatuses.has(inv.status));

    const totalRevenue = bookedInvoices.reduce((sum, inv) => sum + toNumber(inv.totalAmount), 0);
    const paidRevenue = bookedInvoices.reduce((sum, inv) => sum + toNumber(inv.paidAmount), 0);
    const pendingRevenue = openInvoices.reduce((sum, inv) => {
      const total = toNumber(inv.totalAmount);
      const paid = toNumber(inv.paidAmount);
      return sum + Math.max(total - paid, 0);
    }, 0);

    // Calculate this month's revenue
    const thisMonthInvoicesData = await prisma.invoice.findMany({
      where: {
        businessId,
        issueDate: {
          gte: firstDayOfMonth,
        },
        status: {
          in: ["SENT", "PAID"],
        },
      },
      select: {
        totalAmount: true,
      },
    });
    const thisMonthRevenue = thisMonthInvoicesData.reduce(
      (sum, inv) => sum + toNumber(inv.totalAmount),
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
        status: {
          in: ["SENT", "PAID"],
        },
      },
      select: {
        totalAmount: true,
      },
    });
    const lastMonthRevenue = lastMonthInvoicesData.reduce(
      (sum, inv) => sum + toNumber(inv.totalAmount),
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
          (sum: number, inv: { totalAmount: any }) => sum + toNumber(inv.totalAmount),
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
      subscriptionPlan: activeSubscription?.plan || "FREE",
      hasDateFilter
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
