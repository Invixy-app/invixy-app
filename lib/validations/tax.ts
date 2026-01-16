import { z } from "zod";

export const taxSystemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().or(z.literal("")),
  taxId: z.string().min(1, "Tax ID is required"),
  taxType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "COMPOUND", "INCLUSIVE", "EXCLUSIVE"]),
  rate: z.coerce.number().min(0, "Rate must be positive"),
  isCompound: z.boolean().default(false),
  validFrom: z.coerce.date().default(() => new Date()),
  validTo: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
    if (data.taxType === "PERCENTAGE" && data.rate > 100) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Percentage rate cannot exceed 100%",
            path: ["rate"]
        })
    }
    if (data.validTo && data.validFrom && data.validTo < data.validFrom) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Valid To date must be after Valid From date",
            path: ["validTo"]
        })
    }
});

export type TaxSystemFormValues = z.infer<typeof taxSystemSchema>;
