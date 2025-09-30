import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import db from "@/lib/db";
import { authOptions } from "@/lib/auth-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Verify user has access to this business
    const hasAccess = await db.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId: businessId
        }
      }
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    // Get the tax system
    const taxSystem = await db.taxSystem.findFirst({
      where: {
        id: id,
        businessId: businessId
      }
    });

    if (!taxSystem) {
      return NextResponse.json({ error: "Tax system not found" }, { status: 404 });
    }

    return NextResponse.json(taxSystem);

  } catch (error) {
    console.error("[TAX_SYSTEM_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    const body = await request.json();
    const {
      name,
      description,
      taxId,
      taxType,
      rate,
      isCompound,
      isActive,
      validFrom,
      validTo
    } = body;

    const { id } = await params;
    // Get the tax system to verify access
    const existingTaxSystem = await db.taxSystem.findFirst({
      where: {
        id: id,
        business: {
          BusinessUserRole: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    });

    if (!existingTaxSystem) {
      return NextResponse.json({ error: "Tax system not found" }, { status: 404 });
    }

    // Update the tax system
    const updatedTaxSystem = await db.taxSystem.update({
      where: { id: id },
      data: {
        name,
        description,
        taxId,
        taxType,
        rate,
        isCompound: isCompound || false,
        isActive: isActive !== undefined ? isActive : true,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : null
      }
    });

    return NextResponse.json(updatedTaxSystem);

  } catch (error) {
    console.error("[TAX_SYSTEM_PUT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    const { id } = await params;
    // Get the tax system to verify access
    const existingTaxSystem = await db.taxSystem.findFirst({
      where: {
        id: id,
        business: {
          BusinessUserRole: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    });

    if (!existingTaxSystem) {
      return NextResponse.json({ error: "Tax system not found" }, { status: 404 });
    }

    // Check if tax system is being used in any invoices
    const invoiceUsage = await db.invoiceTax.findFirst({
      where: {
        taxSystemId: id
      }
    });

    if (invoiceUsage) {
      return NextResponse.json(
        { error: "Cannot delete tax system that is being used in invoices. Consider deactivating it instead." },
        { status: 400 }
      );
    }

    // Delete the tax system
    await db.taxSystem.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Tax system deleted successfully" });

  } catch (error) {
    console.error("[TAX_SYSTEM_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}