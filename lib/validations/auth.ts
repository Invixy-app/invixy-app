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

export type SignUpInput=z.infer<typeof signUpSchema>;
export type LoginInput=z.infer<typeof loginSchema>;

