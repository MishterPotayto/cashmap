"use client";

import { FeatureContext } from "@/hooks/use-feature-gate";

export function FeatureProvider({
  features,
  children,
}: {
  features: Record<string, boolean>;
  children: React.ReactNode;
}) {
  return (
    <FeatureContext.Provider value={features}>
      {children}
    </FeatureContext.Provider>
  );
}
