import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getTaxSystemsByBusiness, createTaxSystem } from "@/lib/taxSystem";
import { z } from "zod";
import db from "@/lib/db";

import { taxSystemSchema } from "@/lib/validations/tax";

const createTaxSystemSchema = taxSystemSchema.and(z.object({
  businessId: z.string(),
}));

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
      const taxSystems = await getTaxSystemsByBusiness(businessId, session.user.id);
      return NextResponse.json(taxSystems);
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
    const tab = (searchParams.get("tab") || "active").toLowerCase();

    const allRows = await db.taxSystem.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    });

    const now = new Date();
    const isActiveTax = (tax: { isActive: boolean; validTo: Date | null }) =>
      tax.isActive && (!tax.validTo || tax.validTo >= now);

    const activeCount = allRows.filter((tax) => isActiveTax(tax)).length;
    const inactiveCount = allRows.length - activeCount;

    let filtered = allRows;
    if (tab === "active") {
      filtered = allRows.filter((tax) => isActiveTax(tax));
    } else if (tab === "inactive") {
      filtered = allRows.filter((tax) => !isActiveTax(tax));
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize).map((tax) => ({
      ...tax,
      rate: Number(tax.rate),
    }));

    return NextResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      stats: {
        activeCount,
        inactiveCount,
        totalCount: allRows.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching tax systems:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tax systems" },
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
    const validatedData = createTaxSystemSchema.parse(body);

    const taxSystem = await createTaxSystem({
      ...validatedData,
      validFrom: validatedData.validFrom || new Date(),
      isActive: true
    }, session.user.id);

    return NextResponse.json(taxSystem, { status: 201 });
  } catch (error: any) {
    console.error("Error creating tax system:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create tax system" },
      { status: 500 }
    );
  }
}