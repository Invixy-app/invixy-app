import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { EmailService } from "@/lib/email-service";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);
    
    if (!result.success) {
        return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }
    
    const { email } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
         // Generate token
        const token = crypto.randomUUID();
        const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

        // Delete existing tokens
        await prisma.verificationToken.deleteMany({
            where: { identifier: email },
        });

        // Create new token
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
            },
        });

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
        const emailService = new EmailService();
        await emailService.sendPasswordResetEmail(email, resetLink);
    }
    
    return NextResponse.json({ message: "If an account with that email exists, we sent you a password reset link." });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
