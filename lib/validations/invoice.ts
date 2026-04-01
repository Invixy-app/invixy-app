import { z } from "zod";

export const invoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  description: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0.000001, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
  discount: z.coerce.number().min(0).default(0),
  taxSystemIds: z.array(z.string()).default([]),
});

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceNumber: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]).default("DRAFT"),
  issueDate: z.preprocess((val) => (val ? new Date(val as string | number | Date) : undefined), z.date({ message: "Issue date is required" })),
  dueDate: z.coerce.date().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional().or(z.literal("")),
  terms: z.string().optional().or(z.literal("")),
  currency: z.string().default("USD"),
}).refine((data) => {
  if (data.dueDate && data.issueDate) {
    return data.dueDate >= data.issueDate;
  }
  return true;
}, {
  message: "Due date must be on or after the issue date",
  path: ["dueDate"],
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;
