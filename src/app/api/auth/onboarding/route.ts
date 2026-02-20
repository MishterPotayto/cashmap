import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, budgetPeriod, orgName } = await req.json();

  const updateData: Record<string, unknown> = {
    role: role === "ADVISER" ? "ADVISER" : "INDIVIDUAL",
    budgetPeriod: budgetPeriod ?? "FORTNIGHTLY",
    onboardingCompleted: true,
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  // Create organisation for advisers
  if (role === "ADVISER" && orgName) {
    await prisma.organisation.create({
      data: {
        name: orgName,
        ownerId: session.user.id,
      },
    });

    // Link user to org
    const org = await prisma.organisation.findUnique({
      where: { ownerId: session.user.id },
    });
    if (org) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { organisationId: org.id },
      });
    }
  }

  return NextResponse.json({ success: true });
}
