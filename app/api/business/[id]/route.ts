import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireBusinessAccess } from "@/lib/permissions";
import { createBusinessSchema } from "@/lib/validations/auth";
import { Role } from "@prisma/client";
import prisma from "@/lib/db";

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
    const parsedData = createBusinessSchema.partial().safeParse(body);
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