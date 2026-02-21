"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Mail, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const paramEmail = params.get("email");
    const sessionEmail = session?.user?.email ?? null;
    setEmail(sessionEmail ?? paramEmail ?? "");
  }, [params, session]);

  async function handleResend() {
    setResending(true);
    try {
      if (!email) return;
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setResent(true);
    } catch {
      // ignore
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">CashMap</span>
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-gray-600">
            We sent a verification link to {" "}
            <strong>{email || "your email"}</strong>.
            Click the link in the email to verify your account.
          </p>
          <p className="text-xs text-gray-500">
            The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
          </p>

          {!email && (
            <div className="text-left">
              <Label htmlFor="email" className="text-xs text-gray-500">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          {resent ? (
            <p className="text-sm font-medium text-green-600">
              Verification email resent!
            </p>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resending || !email}
            >
              {resending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend verification email"
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full text-gray-500"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
