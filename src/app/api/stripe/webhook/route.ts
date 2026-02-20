import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organisationId;
      if (orgId && session.customer && session.subscription) {
        const proPlan = await prisma.subscriptionPlan.findFirst({
          where: { slug: { startsWith: "pro" }, isActive: true },
        });
        await prisma.organisation.update({
          where: { id: orgId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            planId: proPlan?.id,
            planStatus: "ACTIVE",
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const org = await prisma.organisation.findUnique({
        where: { stripeSubscriptionId: sub.id },
      });
      if (org) {
        const status = sub.status === "active" ? "ACTIVE"
          : sub.status === "past_due" ? "PAST_DUE"
          : sub.status === "trialing" ? "TRIALING"
          : "INACTIVE";
        await prisma.organisation.update({
          where: { id: org.id },
          data: { planStatus: status },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const org = await prisma.organisation.findUnique({
        where: { stripeSubscriptionId: sub.id },
      });
      if (org) {
        const freePlan = await prisma.subscriptionPlan.findUnique({
          where: { slug: "free" },
        });
        await prisma.organisation.update({
          where: { id: org.id },
          data: {
            planStatus: "CANCELLED",
            planId: freePlan?.id,
            stripeSubscriptionId: null,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
