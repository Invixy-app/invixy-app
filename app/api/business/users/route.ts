import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireBusinessAccess } from "@/lib/permissions";
import { Role } from "@prisma/client";
import prisma from "@/lib/db";
import { z } from "zod";

const inviteUserSchema = z.object({
  businessId: z.string(),
  email: z.string().email(),
  role: z.enum(["OWNER", "ACCOUNTANT", "EMPLOYEE"])
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const parsedData = inviteUserSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ errors: parsedData.error.flatten() }, { status: 400 });
    }

    const { businessId, email, role } = parsedData.data;

    // Check if user has permission to invite users (only owners and accountants)
    await requireBusinessAccess(session.user.id, businessId, [Role.OWNER, Role.ACCOUNTANT]);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already part of this business
    const existingRole = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: user.id,
          businessId
        }
      }
    });

    if (existingRole) {
      return NextResponse.json({ error: "User is already part of this business" }, { status: 400 });
    }

    // Add user to business
    await prisma.businessUserRole.create({
      data: {
        userId: user.id,
        businessId,
        role: role as Role
      }
    });

    return NextResponse.json({ message: "User invited successfully" }, { status: 201 });

  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // Check if user has access to this business
    await requireBusinessAccess(session.user.id, businessId);

    // Get all users in this business
    const businessUsers = await prisma.businessUserRole.findMany({
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

    const users = businessUsers.map(bu => ({
      id: bu.user.id,
      name: bu.user.name,
      email: bu.user.email,
      role: bu.role
    }));

    return NextResponse.json({ users }, { status: 200 });

  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}