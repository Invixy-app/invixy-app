import { z } from "zod";

export const businessSchema = z.object({
  name: z.string().min(2, "Name should be at least 2 characters long"),
  description: z.string().max(500, "Description should be at most 500 characters long").optional().or(z.literal("")),
  billingAddress: z.string().min(5, "Billing address should be at least 5 characters long"),
  shippingAddress: z.string().min(5, "Shipping address should be at least 5 characters long"),
  taxRegistrationNumber: z.string().optional().or(z.literal("")),
  phone: z.string().min(10, "Phone should be at least 10 characters long"),
  email: z.string().email({ message: "Not a valid email address!" }),
  website: z.string().optional().or(z.literal("")),
  logo: z.string().url({ message: "Invalid logo URL" }).optional().or(z.literal("")),
  currency: z.string().length(3, "Currency must be 3 characters").optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional()
});

export type BusinessFormValues = z.infer<typeof businessSchema>;
