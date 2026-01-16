import { z } from "zod";

const phoneRegex = /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/;

export const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  phone: z.string().regex(phoneRegex, "Invalid phone number format").optional().or(z.literal("")),
  billingAddress: z.string().optional().or(z.literal("")),
  shippingAddress: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
