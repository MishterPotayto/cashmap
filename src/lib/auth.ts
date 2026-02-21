import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role, BudgetPeriod } from "@/generated/prisma";
import { isLoginBlocked, recordLoginFailure, recordLoginSuccess } from "@/lib/security";
import { headers } from "next/headers";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      role: Role;
      organisationId: string | null;
      budgetPeriod: BudgetPeriod;
      onboardingCompleted: boolean;
      emailVerified: Date | null;
    };
  }

  interface User {
    role?: Role;
    organisationId?: string | null;
    budgetPeriod?: BudgetPeriod;
    onboardingCompleted?: boolean;
    emailVerified?: Date | null;
  }
}

declare module "next-auth" {
  interface JWT {
    role?: Role;
    organisationId?: string | null;
    budgetPeriod?: BudgetPeriod;
    onboardingCompleted?: boolean;
    emailVerified?: Date | string | null;
  }
}

const ownerEmails = (process.env.OWNER_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const hdr = headers();
        const ip = (hdr.get("x-forwarded-for") || hdr.get("x-real-ip") || "unknown").split(",")[0].trim();
        const emailKey = (credentials?.email as string | undefined)?.toLowerCase() || "unknown";
        const rlKey = `${ip}|${emailKey}`;
        const block = isLoginBlocked(rlKey);
        if (block.blocked) {
          // pretend invalid creds for privacy
          await new Promise((r) => setTimeout(r, 300));
          return null;
        }
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) {
          recordLoginFailure(rlKey);
          return null;
        }

        // Block sign-in until email is verified
        if (!user.emailVerified) {
          recordLoginFailure(rlKey);
          return null;
        }

        recordLoginSuccess(rlKey);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          organisationId: user.organisationId,
          budgetPeriod: user.budgetPeriod,
          onboardingCompleted: user.onboardingCompleted,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (user?.email) {
        // If signing in with Google, also mark verified
        const updates: Record<string, unknown> = {};
        if (account?.provider === "google") {
          updates.emailVerified = new Date();
        }
        if (ownerEmails.includes(user.email.toLowerCase())) {
          updates.role = "OWNER";
        }
        if (Object.keys(updates).length > 0) {
          await prisma.user.updateMany({ where: { email: user.email }, data: updates });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign-in - fetch full user data
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email ?? undefined },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.organisationId = dbUser.organisationId;
          token.budgetPeriod = dbUser.budgetPeriod;
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.emailVerified = dbUser.emailVerified;
        }
      }

      if (trigger === "update" && session) {
        // Allow manual session updates
        token.role = session.role ?? token.role;
        token.organisationId = session.organisationId ?? token.organisationId;
        token.budgetPeriod = session.budgetPeriod ?? token.budgetPeriod;
        token.onboardingCompleted =
          session.onboardingCompleted ?? token.onboardingCompleted;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as Role) ?? "INDIVIDUAL";
        session.user.organisationId =
          (token.organisationId as string) ?? null;
        session.user.budgetPeriod =
          (token.budgetPeriod as BudgetPeriod) ?? "FORTNIGHTLY";
        session.user.onboardingCompleted =
          (token.onboardingCompleted as boolean) ?? false;
        session.user.emailVerified =
          token.emailVerified ? new Date(token.emailVerified as string) : null;
      }
      return session;
    },
  },
});
