"use client";

import { createContext, useContext } from "react";

export const FeatureContext = createContext<Record<string, boolean>>({});

export function useFeatureGate(featureKey: string): boolean {
  const features = useContext(FeatureContext);
  return features[featureKey] ?? false;
}

export function useFeatures(): Record<string, boolean> {
  return useContext(FeatureContext);
}
