import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    // If no businessId provided, return global dashboard data
    if (!businessId) {
      // Get all businesses user has access to
      const userBusinesses = await prisma.businessUserRole.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          business: true
        }
      });

      // Calculate global stats
      const businesses = userBusinesses.map(ub => ub.business);
      let totalCustomers = 0;
      let totalProducts = 0;
      let totalInvoices = 0;
      let monthlyRevenue = 0;
      let pendingInvoices = 0;
      let recentRevenue = 0;

      // Get counts for each business
      for (const business of businesses) {
        const customerCount = await prisma.customer.count({
          where: { businessId: business.id }
        });
        const productCount = await prisma.product.count({
          where: { businessId: business.id }
        });
        const invoiceCount = await prisma.invoice.count({
          where: { businessId: business.id }
        });

        // Calculate revenue for this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyInvoices = await prisma.invoice.findMany({
          where: {
            businessId: business.id,
            createdAt: {
              gte: startOfMonth
            },
            status: 'PAID'
          },
          select: {
            totalAmount: true
          }
        });

        const businessMonthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
        monthlyRevenue += businessMonthlyRevenue;

        // Count pending invoices
        const pendingCount = await prisma.invoice.count({
          where: {
            businessId: business.id,
            status: 'SENT'
          }
        });
        pendingInvoices += pendingCount;

        // Calculate recent revenue (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentInvoices = await prisma.invoice.findMany({
          where: {
            businessId: business.id,
            createdAt: {
              gte: sevenDaysAgo
            },
            status: 'PAID'
          },
          select: {
            totalAmount: true
          }
        });

        const businessRecentRevenue = recentInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
        recentRevenue += businessRecentRevenue;

        totalCustomers += customerCount;
        totalProducts += productCount;
        totalInvoices += invoiceCount;
      }

      const stats = {
        totalBusinesses: businesses.length,
        totalCustomers,
        totalProducts,
        totalInvoices,
        monthlyRevenue,
        pendingInvoices,
        recentRevenue,
        revenueGrowth: 12.5 // TODO: Calculate actual growth
      };

      // Get recent activity across all businesses
      const recentActivity = await prisma.invoice.findMany({
        where: {
          businessId: {
            in: businesses.map(b => b.id)
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        include: {
          customer: {
            select: {
              name: true
            }
          },
          business: {
            select: {
              name: true
            }
          }
        }
      });

      const formattedActivity = recentActivity.map(invoice => ({
        id: invoice.id,
        type: 'invoice' as const,
        title: `Invoice #${invoice.invoiceNumber}`,
        description: `Created for ${invoice.customer?.name} - ${invoice.business.name}`,
        timestamp: invoice.createdAt.toISOString(),
        amount: invoice.totalAmount
      }));

      // Enhance businesses data with stats
      const enhancedBusinesses = await Promise.all(
        userBusinesses.map(async (ub) => {
          const customerCount = await prisma.customer.count({
            where: { businessId: ub.business.id }
          });
          const productCount = await prisma.product.count({
            where: { businessId: ub.business.id }
          });
          const invoiceCount = await prisma.invoice.count({
            where: { businessId: ub.business.id }
          });

          const totalRevenue = await prisma.invoice.aggregate({
            where: {
              businessId: ub.business.id,
              status: 'PAID'
            },
            _sum: {
              totalAmount: true
            }
          });

          const pendingAmount = await prisma.invoice.aggregate({
            where: {
              businessId: ub.business.id,
              status: 'SENT'
            },
            _sum: {
              totalAmount: true
            }
          });

          return {
            ...ub.business,
            role: ub.role,
            customerCount,
            productCount,
            invoiceCount,
            totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
            pendingAmount: Number(pendingAmount._sum?.totalAmount || 0),
            status: 'active'
          };
        })
      );

      return NextResponse.json({
        businesses: enhancedBusinesses,
        stats,
        recentActivity: formattedActivity
      });
    }

    // If businessId is provided, return specific business dashboard
    // (Original logic for specific business dashboard would go here)
    return NextResponse.json({ error: "Specific business dashboard not implemented" }, { status: 501 });

  } catch (error: any) {
    console.error('Dashboard API error:', error);
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}