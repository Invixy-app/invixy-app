import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import db from "@/lib/db";
import { productSchema } from "@/lib/validations/product";
import * as XLSX from "xlsx";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const businessId = formData.get("businessId") as string;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    if (!businessId) {
      return new NextResponse("Business ID is required", { status: 400 });
    }

    // specific check for business access can be added here
    
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      return new NextResponse("The uploaded file is empty", { status: 400 });
    }

    // Get all tax systems for this business to map names to IDs
    const taxSystems = await db.taxSystem.findMany({
      where: {
        businessId: businessId,
      },
    });
    
    const taxMap = new Map(taxSystems.map((t: any) => [t.name.toLowerCase(), t.id]));

    const productsToCreate = [];
    const errors = [];
    let successCount = 0;

    for (let i = 0; i < jsonData.length; i++) {
      const row: any = jsonData[i];
      const rowNumber = i + 2; // +2 because 0-index + 1 header row

      try {
        // Map Excel columns to Product fields
        // Expecting Case Insensitive headers or specific names? 
        // Let's normalize keys or just expect standard keys.
        // We will assume the template we give them has specific headers.
        
        const taxSystemName = row["Tax System"] || row["tax system"] || row["TaxSystem"];
        let taxSystemId = null;
        if (taxSystemName && typeof taxSystemName === 'string') {
            const normalizedTaxName = taxSystemName.toLowerCase().trim();
            if (taxMap.has(normalizedTaxName)) {
                taxSystemId = taxMap.get(normalizedTaxName);
            }
        }

        const productData = {
            name: row["Name"]?.toString() || "",
            description: row["Description"]?.toString() || "",
            sku: row["SKU"]?.toString() || "",
            price: Number(row["Price"]) || 0,
            cost: row["Cost"] ? Number(row["Cost"]) : undefined,
            category: row["Category"]?.toString() || "",
            unit: row["Unit"]?.toString() || "pcs",
            stockQuantity: row["Stock Quantity"] ? Number(row["Stock Quantity"]) : 0,
            minStockLevel: row["Alert Level"] ? Number(row["Alert Level"]) : 0,
            taxSystemId: taxSystemId,
            isActive: true, // Default to true
        };

        // Validate using Zod
        const validated = productSchema.parse(productData);

        productsToCreate.push({
            ...validated,
            businessId: businessId,
        });

      } catch (err: any) {
        if (err instanceof z.ZodError) {
            const errorMessages = err.message;
            errors.push(`Row ${rowNumber}: ${errorMessages}`);
        } else {
            console.error(err);
            errors.push(`Row ${rowNumber}: Unexpected error`);
        }
      }
    }

    if (productsToCreate.length > 0) {
        // Use transaction or createMany
        // createMany is faster
        await db.product.createMany({
            data: productsToCreate,
        });
        successCount = productsToCreate.length;
    }

    return NextResponse.json({
        success: true,
        count: successCount,
        errors: errors,
        totalRows: jsonData.length
    });

  } catch (error) {
    console.error("Error processing bulk upload:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
