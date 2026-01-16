import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password, confirmPassword } = body;

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });

    if (!result.success) {
         return NextResponse.json({ message: "Invalid password" }, { status: 400 });
    }
    
    if (!token) {
        return NextResponse.json({ message: "Missing token" }, { status: 400 });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

    if (new Date() > verificationToken.expires) {
         await prisma.verificationToken.delete({ where: { token } });
         return NextResponse.json({ message: "Token expired" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { password: hashedPassword },
    });

    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
