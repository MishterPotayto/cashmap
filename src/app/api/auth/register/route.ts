import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/resend";

const ownerEmails = (process.env.OWNER_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Simple in-memory rate limiting
const attempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max attempts
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  record.count++;
  return record.count > RATE_LIMIT;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

function sanitize(str: string): string {
  return str.replace(/[<>]/g, "").trim();
}

export async function POST(req: Request) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { name, email, password } = await req.json();

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = sanitize(email).toLowerCase();
    const cleanName = sanitize(name || "");

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Password strength
    const pwError = validatePassword(password);
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 });
    }

    // Check existing user — generic error to prevent email enumeration
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Unable to create account. Please try a different email." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with emailVerified = null (unverified)
    await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        hashedPassword,
        role: ownerEmails.includes(cleanEmail) ? "OWNER" : "INDIVIDUAL",
        onboardingCompleted: false,
        emailVerified: null,
      },
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: cleanEmail,
        token,
        expires,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail({ to: cleanEmail, token });
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
      // Account is still created — user can request a new verification email
    }

    return NextResponse.json(
      { success: true, message: "Account created. Please check your email to verify." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
