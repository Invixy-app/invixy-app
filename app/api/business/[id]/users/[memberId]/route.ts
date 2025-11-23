import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireBusinessAccess } from "@/lib/permissions";
import { Role } from "@prisma/client";
import prisma from "@/lib/db";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["OWNER", "ACCOUNTANT", "EMPLOYEE", "MANAGER", "VIEWER"])
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: businessId, memberId } = await params;
    const body = await req.json();

    const parsedData = updateRoleSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ errors: parsedData.error.flatten() }, { status: 400 });
    }

    const { role } = parsedData.data;

    // Only OWNER can update roles
    await requireBusinessAccess(session.user.id, businessId, [Role.OWNER]);

    const targetMember = await prisma.businessUserRole.findUnique({
      where: { id: memberId }
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Verify the member belongs to the business
    if (targetMember.businessId !== businessId) {
      return NextResponse.json({ error: "Member does not belong to this business" }, { status: 400 });
    }

    // Prevent removing the last owner
    if (targetMember.role === Role.OWNER && role !== Role.OWNER) {
       const ownerCount = await prisma.businessUserRole.count({
         where: {
           businessId,
           role: Role.OWNER
         }
       });
       if (ownerCount <= 1) {
         return NextResponse.json({ error: "Cannot remove the last owner" }, { status: 400 });
       }
    }

    const updatedMember = await prisma.businessUserRole.update({
      where: { id: memberId },
      data: { role: role as Role }
    });

    return NextResponse.json(updatedMember);

  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error updating member role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: businessId, memberId } = await params;

    // Only OWNER can remove members
    await requireBusinessAccess(session.user.id, businessId, [Role.OWNER]);

    const targetMember = await prisma.businessUserRole.findUnique({
      where: { id: memberId }
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Verify the member belongs to the business
    if (targetMember.businessId !== businessId) {
      return NextResponse.json({ error: "Member does not belong to this business" }, { status: 400 });
    }

    // Prevent removing the last owner
    if (targetMember.role === Role.OWNER) {
       const ownerCount = await prisma.businessUserRole.count({
         where: {
           businessId,
           role: Role.OWNER
         }
       });
       if (ownerCount <= 1) {
         return NextResponse.json({ error: "Cannot remove the last owner" }, { status: 400 });
       }
    }

    await prisma.businessUserRole.delete({
      where: { id: memberId }
    });

    return NextResponse.json({ message: "Member removed successfully" });

  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
