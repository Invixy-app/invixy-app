import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import db from "@/lib/db";
import * as XLSX from "xlsx";
import { z } from "zod";

const bulkRequiredProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price: z.number().min(0, "Price must be a valid non-negative number"),
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
      return NextResponse.json({ error: "Insufficient permissions", errors: ["You do not have permission to import products for this business."] }, { status: 403 });
    }
    
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: "Invalid file", errors: ["No worksheet found in uploaded file."] }, { status: 400 });
    }
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    if (jsonData.length === 0) {
      return NextResponse.json({ error: "The uploaded file is empty", errors: ["The uploaded file has no data rows."] }, { status: 400 });
    }

    const headerKeys = Object.keys(jsonData[0] || {});
    if (!headerKeys.includes("Name") || !headerKeys.includes("Price")) {
      return NextResponse.json({ error: "Invalid template", errors: ["Required columns 'Name' and 'Price' are missing from the uploaded file."] }, { status: 400 });
    }

    // Get all tax systems for this business to map names to IDs
    const taxSystems = await db.taxSystem.findMany({
      where: {
        businessId: businessId,
      },
    });
    
    const taxMap = new Map(taxSystems.map((t: any) => [t.name.toLowerCase(), t.id]));

    const productsToCreate: Array<{
      businessId: string;
      name: string;
      description?: string;
      sku?: string;
      price: number;
      cost?: number;
      category?: string;
      unit: string;
      stockQuantity: number;
      minStockLevel: number;
      taxSystemId?: string;
      isActive: boolean;
    }> = [];
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as Record<string, unknown>;
      const rowNumber = i + 2; // +2 because 0-index + 1 header row

      try {
        // Map Excel columns to Product fields
        // Expecting Case Insensitive headers or specific names? 
        // Let's normalize keys or just expect standard keys.
        // We will assume the template we give them has specific headers.
        
        const taxCell = row["Tax Name"] ?? row["tax name"] ?? row["Tax System"] ?? row["tax system"] ?? row["TaxSystem"] ?? row["Tax ID"] ?? row["tax id"];
        let taxSystemId: string | undefined;
        if (typeof taxCell === "string") {
          const normalizedTaxName = taxCell.trim().toLowerCase();
          if (normalizedTaxName.length > 0) {
            if (taxMap.has(normalizedTaxName)) {
              taxSystemId = taxMap.get(normalizedTaxName);
            } else {
              errors.push(`Row ${rowNumber}: Tax name '${taxCell}' not found for this business.`);
              continue;
            }
          }
        }

        const toNumber = (value: unknown): number | null => {
          if (value === "" || value === null || value === undefined) return null;
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : null;
        };

        const parsedPrice = toNumber(row["Price"]);
        if (parsedPrice === null || parsedPrice < 0) {
          errors.push(`Row ${rowNumber}: Price must be a valid non-negative number.`);
          continue;
        }

        const parsedCost = toNumber(row["Cost"]);
        const parsedStock = toNumber(row["Stock Quantity"]);
        const parsedAlert = toNumber(row["Alert Level"]);

        if (parsedCost !== null && parsedCost < 0) {
          errors.push(`Row ${rowNumber}: Cost must be non-negative.`);
          continue;
        }
        if (parsedStock !== null && parsedStock < 0) {
          errors.push(`Row ${rowNumber}: Stock Quantity must be non-negative.`);
          continue;
        }
        if (parsedAlert !== null && parsedAlert < 0) {
          errors.push(`Row ${rowNumber}: Alert Level must be non-negative.`);
          continue;
        }

        const productData = {
          name: row["Name"]?.toString() || "",
          description: row["Description"]?.toString() || "",
          sku: row["SKU"]?.toString() || "",
          price: parsedPrice,
          cost: parsedCost ?? undefined,
          category: row["Category"]?.toString() || "",
          unit: row["Unit"]?.toString() || "pcs",
          stockQuantity: parsedStock ?? 0,
          minStockLevel: parsedAlert ?? 0,
          taxSystemId,
          isActive: true,
        };

        const validatedRequired = bulkRequiredProductSchema.parse({
          name: productData.name,
          price: productData.price,
        });

        productsToCreate.push({
          businessId,
          ...productData,
          name: validatedRequired.name,
          price: validatedRequired.price,
        });

      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
            const errorMessages = err.issues.map((issue) => issue.message).join(", ");
            errors.push(`Row ${rowNumber}: ${errorMessages}`);
        } else {
            const message = err instanceof Error ? err.message : "Unexpected error";
            errors.push(`Row ${rowNumber}: ${message}`);
        }
      }
    }

    for (let i = 0; i < productsToCreate.length; i++) {
      const rowNumber = i + 2;
      try {
        await db.product.create({ data: productsToCreate[i] });
        successCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        errors.push(`Row ${rowNumber}: Failed to save product (${message}).`);
      }
    }

    return NextResponse.json({
        success: errors.length === 0,
        count: successCount,
        errors: errors,
        totalRows: jsonData.length
    });

  } catch (error) {
    console.error("Error processing bulk upload:", error);
    return NextResponse.json({ error: "Internal Server Error", errors: ["Unexpected error while importing products."] }, { status: 500 });
  }
}
