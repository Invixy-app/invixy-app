import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import db from "@/lib/db";
import * as XLSX from "xlsx";
import { z } from "zod";
import { canAccessProFeature } from "@/lib/subscription";

const customerRowSchema = z.object({
  Name: z.string().min(1, "Name is required"),
  Email: z.string().email({ message: "Invalid email" }).optional().or(z.literal("")),
  Phone: z.string().optional().or(z.literal("")),
  "Billing Address": z.string().optional().or(z.literal("")),
  "Shipping Address": z.string().optional().or(z.literal("")),
  "Tax ID": z.string().optional().or(z.literal("")),
  Notes: z.string().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized", errors: ["You are not authenticated."] }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const businessId = formData.get("businessId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded", errors: ["Please upload an Excel file."] }, { status: 400 });
    }

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required", errors: ["Business context is missing."] }, { status: 400 });
    }

    const allowedMimeTypes = new Set([
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/octet-stream",
    ]);
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
      return NextResponse.json({ error: "Invalid file type", errors: ["Only .xlsx and .xls files are supported."] }, { status: 400 });
    }
    if (file.type && !allowedMimeTypes.has(file.type)) {
      return NextResponse.json({ error: "Invalid file type", errors: ["The uploaded file is not a valid Excel document."] }, { status: 400 });
    }

    const access = await db.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId,
        },
      },
    });
    if (!access || access.role === "VIEWER") {
      return NextResponse.json({ error: "Insufficient permissions", errors: ["You do not have permission to import customers for this business."] }, { status: 403 });
    }

    const proAccess = await canAccessProFeature(businessId);
    if (!proAccess.allowed) {
      return NextResponse.json(
        {
          error: "Upgrade required",
          errors: [proAccess.message || "Bulk import is available on Pro and Enterprise plans."],
        },
        { status: 403 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) {
      return NextResponse.json({ error: "Invalid file", errors: ["No worksheet found in uploaded file."] }, { status: 400 });
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
    if (jsonData.length === 0) {
      return NextResponse.json({ error: "Empty file", errors: ["The uploaded file has no data rows."] }, { status: 400 });
    }

    const headerKeys = Object.keys(jsonData[0] || {});
    if (!headerKeys.includes("Name")) {
      return NextResponse.json({ error: "Invalid template", errors: ["Required column 'Name' is missing from the uploaded file."] }, { status: 400 });
    }

    const validCustomers: Array<{
      businessId: string;
      name: string;
      email: string | null;
      phone: string | null;
      billingAddress: string | null;
      shippingAddress: string | null;
      taxId: string | null;
      notes: string | null;
    }> = [];
    const errors: string[] = [];
    let rowIndex = 2; // Start from row 2 (header is row 1)

    for (const row of jsonData as any[]) {
      try {
        const validated = customerRowSchema.parse(row);
        
        validCustomers.push({
            businessId,
            name: validated.Name,
            email: validated.Email || null,
            phone: validated.Phone || null,
            billingAddress: validated["Billing Address"] || null,
            shippingAddress: validated["Shipping Address"] || null,
            taxId: validated["Tax ID"] || null,
            notes: validated.Notes || null,
        });

      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
            const rowErrors = err.issues.map((e) => e.message).join(", ");
            errors.push(`Row ${rowIndex}: ${rowErrors}`);
        } else {
            errors.push(`Row ${rowIndex}: Invalid data`);
        }
      }
      rowIndex++;
    }

    let successCount = 0;
    for (let i = 0; i < validCustomers.length; i++) {
      const customer = validCustomers[i];
      const sheetRow = i + 2;
      try {
        await db.customer.create({ data: customer });
        successCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        errors.push(`Row ${sheetRow}: Failed to save customer (${message}).`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      count: successCount,
      totalRows: jsonData.length,
      errors: errors
    });

  } catch (error) {
    console.error("Bulk customer import error:", error);
    return NextResponse.json({ error: "Internal Server Error", errors: ["Unexpected error while importing customers."] }, { status: 500 });
  }
}
