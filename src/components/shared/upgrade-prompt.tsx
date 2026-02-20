"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  feature: string;
  children?: React.ReactNode;
}

export function UpgradePrompt({ feature, children }: UpgradePromptProps) {
  return (
    <div className="relative">
      {children && (
        <div className="pointer-events-none select-none opacity-30 blur-sm">
          {children}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="max-w-sm border-blue-200 bg-white/95 shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="rounded-full bg-blue-100 p-3">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{feature}</h3>
              <p className="mt-1 text-sm text-gray-500">
                This feature is available on the Pro plan.
              </p>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/api/stripe/checkout">Upgrade to Pro</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
