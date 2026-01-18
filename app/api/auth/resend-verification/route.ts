import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { randomUUID } from "crypto";
import { EmailService } from "@/lib/email-service";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
        return NextResponse.json({ message: "If an account exists, a verification email has been sent." });
    }

    if (user.emailVerified) {
        return NextResponse.json({ message: "Email is already verified." });
    }

    // Create verification token
    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete existing tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send email
    const emailService = new EmailService();
    await emailService.sendVerificationEmail(email, token);

    return NextResponse.json({ success: true, message: "Verification email sent." });
  } catch (error) {
      if (error instanceof z.ZodError) {
          return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
