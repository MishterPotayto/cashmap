import { prisma } from "@/lib/prisma";

/**
 * Check if a user can access a specific feature.
 * Resolution order:
 * 1. Owner can access everything
 * 2. User's organisation plan features
 * 3. Free plan features (if no org)
 * 4. Feature's defaultEnabled flag
 */
export async function canAccessFeature(
  userId: string,
  featureKey: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organisation: {
        include: {
          plan: {
            include: {
              features: {
                include: { feature: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return false;

  // Owner can access everything
  if (user.role === "OWNER") return true;

  // Check if feature exists
  const feature = await prisma.featureGate.findUnique({
    where: { key: featureKey },
  });

  if (!feature) return false;

  // If user is in an org with an active plan, check plan features
  if (
    user.organisation?.plan &&
    ["ACTIVE", "TRIALING"].includes(user.organisation.planStatus)
  ) {
    const planFeatures = user.organisation.plan.features.map(
      (pf) => pf.feature.key
    );
    if (planFeatures.includes(featureKey)) return true;
  }

  // Check free plan
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { slug: "free" },
    include: {
      features: {
        include: { feature: true },
      },
    },
  });

  if (freePlan) {
    const freeFeatures = freePlan.features.map((pf) => pf.feature.key);
    if (freeFeatures.includes(featureKey)) return true;
  }

  // Fallback to defaultEnabled
  return feature.defaultEnabled;
}

/**
 * Get all features for a user as a key-value map.
 * Used for client-side hydration.
 */
export async function getUserFeatures(
  userId: string
): Promise<Record<string, boolean>> {
  const allFeatures = await prisma.featureGate.findMany();
  const result: Record<string, boolean> = {};

  for (const feature of allFeatures) {
    result[feature.key] = await canAccessFeature(userId, feature.key);
  }

  return result;
}
