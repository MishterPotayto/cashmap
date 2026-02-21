export function validatePasswordStrong(password: string, context?: { email?: string; name?: string }): string | null {
  const pw = password ?? "";
  if (pw.length < 12) return "Password must be at least 12 characters long";
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(pw)) return "Password must contain a number";
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?`~|\\]/.test(pw)) return "Password must contain a symbol";

  const common = new Set([
    "password","123456","123456789","qwerty","111111","12345678","abc123","password1","123123","iloveyou",
    "000000","12345","letmein","monkey","dragon","sunshine","princess","welcome","football","admin",
  ]);
  if (common.has(pw.toLowerCase())) return "Password is too common";

  const localPart = context?.email?.split("@")[0]?.toLowerCase();
  if (localPart && pw.toLowerCase().includes(localPart)) return "Password cannot contain your email";
  if (context?.name && pw.toLowerCase().includes(context.name.toLowerCase())) return "Password cannot contain your name";
  if (/^(.)\1{7,}$/.test(pw)) return "Password cannot be repeated characters";
  return null;
}

// Simple in-memory login rate limiter with exponential backoff per (ip+email)
const attempts = new Map<string, { count: number; lockedUntil: number }>();

export function isLoginBlocked(key: string): { blocked: boolean; retryAfterSec: number } {
  const rec = attempts.get(key);
  if (!rec) return { blocked: false, retryAfterSec: 0 };
  const now = Date.now();
  if (rec.lockedUntil && now < rec.lockedUntil) {
    return { blocked: true, retryAfterSec: Math.ceil((rec.lockedUntil - now) / 1000) };
  }
  return { blocked: false, retryAfterSec: 0 };
}

export function recordLoginFailure(key: string) {
  const rec = attempts.get(key) ?? { count: 0, lockedUntil: 0 };
  rec.count += 1;
  // lock after 5, exponential backoff (30s, 60s, 120s... max 15 min)
  if (rec.count >= 5) {
    const base = 30000; // 30s
    const delay = Math.min(base * Math.pow(2, rec.count - 5), 15 * 60 * 1000);
    rec.lockedUntil = Date.now() + delay;
  }
  attempts.set(key, rec);
}

export function recordLoginSuccess(key: string) {
  attempts.delete(key);
}