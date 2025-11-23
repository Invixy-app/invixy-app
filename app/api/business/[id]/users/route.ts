import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireBusinessAccess } from "@/lib/permissions";
import { Role } from "@prisma/client";
import prisma from "@/lib/db";
import { z } from "zod";

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ACCOUNTANT", "EMPLOYEE", "MANAGER", "VIEWER"])
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: businessId } = await params;

    await requireBusinessAccess(session.user.id, businessId);

    const businessUsers = await prisma.businessUserRole.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ users: businessUsers });

  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error fetching business users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: businessId } = await params;
    const body = await req.json();

    const parsedData = inviteUserSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ errors: parsedData.error.flatten() }, { status: 400 });
    }

    const { email, role } = parsedData.data;

    // Only OWNER and MANAGER can invite
    await requireBusinessAccess(session.user.id, businessId, [Role.OWNER, Role.MANAGER]);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found. They must register first." }, { status: 404 });
    }

    const existingRole = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: user.id,
          businessId
        }
      }
    });

    if (existingRole) {
      return NextResponse.json({ error: "User is already a member of this business" }, { status: 400 });
    }

    const newMember = await prisma.businessUserRole.create({
      data: {
        userId: user.id,
        businessId,
        role: role as Role
      },
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

    return NextResponse.json(newMember, { status: 201 });

  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error inviting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
