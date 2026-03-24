import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import db from "@/lib/db";
import * as XLSX from "xlsx";
import { z } from "zod";

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
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const businessId = formData.get("businessId") as string;

    if (!file || !businessId) {
      return new NextResponse("Missing file or business ID", { status: 400 });
    }

    // specific check for business permissions could go here

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Read first sheet
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const validCustomers = [];
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

      } catch (err: any) {
        if (err.errors) {
            const rowErrors = err.errors.map((e: any) => e.message).join(", ");
            errors.push(`Row ${rowIndex}: ${rowErrors}`);
        } else {
            errors.push(`Row ${rowIndex}: Invalid data`);
        }
      }
      rowIndex++;
    }

    if (validCustomers.length > 0) {
      await db.customer.createMany({
        data: validCustomers,
      });
    }

    return NextResponse.json({
      success: true,
      count: validCustomers.length,
      totalRows: jsonData.length,
      errors: errors
    });

  } catch (error) {
    console.error("Bulk customer import error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
