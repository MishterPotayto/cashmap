import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=InvalidToken", req.url));
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return NextResponse.redirect(new URL("/login?error=InvalidToken", req.url));
  }

  if (verificationToken.expires < new Date()) {
    // Clean up expired token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: verificationToken.identifier, token } },
    });
    return NextResponse.redirect(new URL("/login?error=TokenExpired", req.url));
  }

  // Mark user as verified
  await prisma.user.updateMany({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  // Consume the verification token
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: verificationToken.identifier, token } },
  });

  // Create a short-lived one-time login token (5 minutes)
  const loginToken = crypto.randomBytes(32).toString("hex");
  const loginExpires = new Date(Date.now() + 5 * 60 * 1000);
  await prisma.verificationToken.create({
    data: {
      identifier: verificationToken.identifier,
      token: loginToken,
      expires: loginExpires,
    },
  });

  // Auto sign-in the user and send them to onboarding
  return signIn("credentials", {
    email: verificationToken.identifier,
    loginToken,
    redirectTo: "/onboarding",
  });
}
