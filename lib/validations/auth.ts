import {z} from "zod";
export const signUpSchema=z.object({
    name:z.string().min(2,"Name should be at least 2 characters long"),
    email:z.string().email("Invalid email address"),
    password:z.string().min(6,"Password should be at least 6 characters long")
})
export const loginSchema=z.object({
    email:z.string().email("Invalid email address"),
    password:z.string().min(6,"Password should be at least 6 characters long")
})

export const createBusinessSchema=z.object({
    name:z.string().min(2,"Name should be at least 2 characters long"),
    description:z.string().max(500,"Description should be at most 500 characters long").optional(),
    billingAddress:z.string().min(5,"Billing address should be at least 5 characters long"),
    shippingAddress:z.string().min(5,"Shipping address should be at least 5 characters long"),
    taxRegistrationNumber:z.string().optional(),
    phone:z.string().min(10,"Phone should be at least 10 characters long"),
    email:z.string().email("Not a valid email address!"),
    website:z.string().optional(),
    logo:z.string().url("Invalid logo URL").optional(),
    currency:z.string().length(3,"Currency must be 3 characters").optional(),
    timezone:z.string().optional(),
    isActive:z.boolean().optional()
})

export type SignUpInput=z.infer<typeof signUpSchema>;
export type LoginInput=z.infer<typeof loginSchema>;

