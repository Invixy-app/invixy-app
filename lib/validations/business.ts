import { z } from "zod";

const phoneRegex = /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/;

export const businessSchema = z.object({
  name: z.string().min(2, "Name should be at least 2 characters long"),
  description: z.string().max(500, "Description should be at most 500 characters long").optional().or(z.literal("")),
  billingAddress: z.string().min(5, "Billing address should be at least 5 characters long"),
  shippingAddress: z.string().min(5, "Shipping address should be at least 5 characters long"),
  taxRegistrationNumber: z.string().optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number should be at least 10 characters").regex(phoneRegex, "Invalid phone number format"),
  email: z.string().email({ message: "Not a valid email address!" }),
  website: z.string().url({ message: "Invalid URL format (must verify protocol e.g. https://)" }).optional().or(z.literal("")),
  logo: z.string().optional().or(z.literal("")),
  currency: z.string().length(3, "Currency must be 3 characters (ISO code)"),
  timezone: z.string().min(1, "Timezone is required"),
  isActive: z.boolean().default(true),
});

export type BusinessFormValues = z.infer<typeof businessSchema>;
