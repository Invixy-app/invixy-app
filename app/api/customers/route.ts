import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getCustomersByBusiness, createCustomer } from "@/lib/customer";
import { z } from "zod";
import { authOptions } from "@/lib/auth-config";
import { customerSchema } from "@/lib/validations/customer";
import { checkCustomerLimit } from "@/lib/subscription";
import db from "@/lib/db";

const createCustomerSchema = customerSchema.extend({
  businessId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const paginated = searchParams.get("paginated") === "true";

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    if (!paginated) {
      const customers = await getCustomersByBusiness(businessId, session.user.id);
      return NextResponse.json(customers);
    }

    const access = await db.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId,
        },
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "10")));
    const search = (searchParams.get("search") || "").trim();

    const whereClause: any = {
      businessId,
      isActive: true,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total, withEmailCount] = await Promise.all([
      db.customer.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.customer.count({ where: whereClause }),
      db.customer.count({
        where: {
          businessId,
          isActive: true,
          email: { not: null },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages,
      stats: {
        activeCount: total,
        withEmailCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCustomerSchema.parse(body);

    const limitCheck = await checkCustomerLimit(validatedData.businessId);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const customer = await createCustomer({
      ...validatedData,
      email: validatedData.email || null,
      isActive: true
    }, session.user.id);

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}