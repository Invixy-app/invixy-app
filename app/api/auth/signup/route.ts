import { signUpSchema } from '@/lib/validations/auth';
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from '@/lib/db';
import { randomUUID } from 'crypto';
import { EmailService } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = signUpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, password } = parsed.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    })

    // Create verification token
    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing tokens for this email to avoid clutter and duplicates if @@unique constraint hits (though token is unique usually)
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    });

    // Send verification email
    try {
      const emailService = new EmailService();
      await emailService.sendVerificationEmail(email, token);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json({ 
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      message: "Account created! Please check your email to verify your account." 
    })
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 })
  }
}
