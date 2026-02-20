import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const publicRoutes = ["/", "/login", "/register", "/api/auth", "/api/stripe/webhook", "/verify-email"];
const adviserRoutes = ["/clients", "/mappings", "/organisation"];
const adminRoutes = ["/admin"];

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      const isLoggedIn = !!auth?.user;

      // Allow public routes
      if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
        return true;
      }

      // Require auth for everything else
      if (!isLoggedIn) return false;

      // Check email verification — block unverified credential users
      // emailVerified is set in the JWT by auth.ts
      const emailVerified = (auth?.user as { emailVerified?: Date | string | null })?.emailVerified;
      if (!emailVerified && pathname !== "/verify-email") {
        return Response.redirect(new URL("/verify-email", nextUrl));
      }

      // Admin routes — owner only
      if (adminRoutes.some((r) => pathname.startsWith(r))) {
        const role = (auth?.user as { role?: string })?.role;
        if (role !== "OWNER") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }

      // Adviser routes
      if (adviserRoutes.some((r) => pathname.startsWith(r))) {
        const role = (auth?.user as { role?: string })?.role;
        if (role !== "ADVISER" && role !== "OWNER") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }

      return true;
    },
  },
};
