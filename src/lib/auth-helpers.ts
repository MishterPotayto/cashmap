import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma";
import type { SessionUser } from "@/lib/types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role) && user.role !== "OWNER") {
    redirect("/dashboard");
  }
  return user;
}

export async function requireOwner(): Promise<SessionUser> {
  return requireRole("OWNER");
}

export async function requireAdviser(): Promise<SessionUser> {
  return requireRole("ADVISER", "OWNER");
}

export function isOwner(user: SessionUser): boolean {
  return user.role === "OWNER";
}

export function isAdviser(user: SessionUser): boolean {
  return user.role === "ADVISER" || user.role === "OWNER";
}

export function isClient(user: SessionUser): boolean {
  return user.role === "CLIENT";
}
