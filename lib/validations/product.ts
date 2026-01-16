import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().or(z.literal("")),
  sku: z.string().min(1, "SKU is required").optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price must be positive"),
  cost: z.coerce.number().min(0, "Cost must be positive").optional(),
  category: z.string().optional().or(z.literal("")),
  unit: z.string().min(1, "Unit is required").default("pcs"),
  stockQuantity: z.coerce.number().int("Stock must be an integer").min(0).default(0),
  minStockLevel: z.coerce.number().int("Min stock must be an integer").min(0).default(0),
  taxSystemId: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;
