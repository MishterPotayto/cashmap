import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await req.json();
  const pid = priceId ?? process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

  // Get or create org
  let org = await prisma.organisation.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!org) {
    org = await prisma.organisation.create({
      data: { name: `${session.user.name}'s Organisation`, ownerId: session.user.id },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkoutSession = await createCheckoutSession({
    organisationId: org.id,
    email: session.user.email,
    priceId: pid,
    successUrl: `${appUrl}/dashboard?upgraded=true`,
    cancelUrl: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
