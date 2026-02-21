import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const ownerEmails = (process.env.OWNER_EMAILS ?? 'coynslax@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  const owner = await prisma.user.findFirst({ where: { email: { in: ownerEmails, mode: 'insensitive' } }, select: { id: true } })
  const ownerId = owner?.id ?? null

  // Orgs not owned by owner
  const orgs = await prisma.organisation.findMany({ where: ownerId ? { ownerId: { not: ownerId } } : {}, select: { id: true } })
  const orgIds = orgs.map(o => o.id)

  // Detach members from those orgs
  if (orgIds.length) {
    await prisma.user.updateMany({ where: { organisationId: { in: orgIds } }, data: { organisationId: null } })
    await prisma.mappingRule.deleteMany({ where: { organisationId: { in: orgIds } } })
    await prisma.clientInvite.deleteMany({ where: { organisationId: { in: orgIds } } })
    await prisma.organisation.deleteMany({ where: { id: { in: orgIds } } })
  }

  // User-scoped rules for non-owners
  await prisma.mappingRule.deleteMany({ where: { userId: { not: ownerId ?? undefined } } })

  // Non-owner verification tokens
  await prisma.verificationToken.deleteMany({ where: { identifier: { notIn: ownerEmails } } })

  // Delete all users except owners
  await prisma.user.deleteMany({ where: { email: { notIn: ownerEmails } } })
}

main().then(() => process.exit(0)).catch(async (e) => { console.error(e); process.exit(1) })