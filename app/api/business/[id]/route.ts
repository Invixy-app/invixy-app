import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireBusinessAccess } from "@/lib/permissions";
import { businessSchema } from "@/lib/validations/business";
import { Role } from "@prisma/client";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: businessId } = await params;

    // Check if user has access to this business
    await requireBusinessAccess(session.user.id, businessId);

    // Get business details with user role
    const businessRole = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId
        }
      },
      include: {
        business: true
      }
    });

    if (!businessRole) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get business statistics
    const customerCount = await prisma.customer.count({
      where: { businessId }
    });
    
    const productCount = await prisma.product.count({
      where: { businessId }
    });
    
    const invoiceCount = await prisma.invoice.count({
      where: { businessId }
    });

    // Calculate revenue metrics
    const totalRevenue = await prisma.invoice.aggregate({
      where: {
        businessId,
        status: {
          in: ['SENT', 'PAID']
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    const pendingAmount = await prisma.invoice.aggregate({
      where: {
        businessId,
        status: 'SENT'
      },
      _sum: {
        totalAmount: true
      }
    });

    // Monthly revenue (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await prisma.invoice.aggregate({
      where: {
        businessId,
        createdAt: {
          gte: startOfMonth
        },
        status: {
          in: ['SENT', 'PAID']
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    // Get team members
    const teamMembers = await prisma.businessUserRole.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get recent activity (recent invoices)
    const recentActivity = await prisma.invoice.findMany({
      where: { businessId },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        customer: {
          select: {
            name: true
          }
        }
      }
    });

    const formattedActivity = recentActivity.map(invoice => ({
      id: invoice.id,
      type: 'invoice',
      title: `Invoice #${invoice.invoiceNumber}`,
      description: `Created for ${invoice.customer?.name || 'Unknown Customer'}`,
      timestamp: invoice.createdAt.toISOString(),
      amount: invoice.totalAmount
    }));

    const businessWithStats = {
      ...businessRole.business,
      role: businessRole.role,
      customerCount,
      productCount,
      invoiceCount,
      totalRevenue: totalRevenue._sum?.totalAmount || 0,
      pendingAmount: pendingAmount._sum?.totalAmount || 0,
      monthlyRevenue: monthlyRevenue._sum?.totalAmount || 0,
      status: businessRole.business.isActive ? 'active' : 'inactive',
      users: teamMembers.map(tm => ({
        id: tm.user.id,
        name: tm.user.name || '',
        email: tm.user.email || '',
        role: tm.role,
        joinedAt: new Date().toISOString() // Since we don't have createdAt on BusinessUserRole, use current date as placeholder
      }))
    };

    return NextResponse.json({
      business: businessWithStats,
      recentActivity: formattedActivity
    }, { status: 200 });

  } catch (error: any) {
    console.error('Business GET error:', error);
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { id: businessId } = await params;

    // Check if user has permission to edit this business
    await requireBusinessAccess(session.user.id, businessId, [Role.OWNER, Role.ACCOUNTANT]);

    // Validate the update data
    const parsedData = businessSchema.partial().safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: parsedData.error.flatten() 
      }, { status: 400 });
    }

    // Update the business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...parsedData.data,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: "Business updated successfully", 
      business: updatedBusiness 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Business PUT error:', error);
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const { id: businessId } = await params;

    // Check if user has permission to edit this business
    await requireBusinessAccess(session.user.id, businessId, [Role.OWNER, Role.ACCOUNTANT]);

    // Validate the update data
    const parsedData = businessSchema.partial().safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ errors: parsedData.error.flatten() }, { status: 400 });
    }

    // Update the business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...parsedData.data,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: "Business updated successfully", 
      business: updatedBusiness 
    }, { status: 200 });

  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: businessId } = await params;

    // Only owners can delete a business
    await requireBusinessAccess(session.user.id, businessId, [Role.OWNER]);

    // Soft delete by setting isActive to false
    await prisma.business.update({
      where: { id: businessId },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ message: "Business deleted successfully" }, { status: 200 });

  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}