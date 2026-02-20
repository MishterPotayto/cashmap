import { requireAdviser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const user = await requireAdviser();

  const org = await prisma.organisation.findUnique({
    where: { ownerId: user.id },
    include: {
      members: {
        where: { role: "CLIENT" },
        select: {
          id: true,
          name: true,
          email: true,
          budgetPeriod: true,
          createdAt: true,
          _count: { select: { transactions: true } },
        },
      },
      invites: {
        where: { status: "PENDING" },
        select: { id: true, email: true, createdAt: true },
      },
    },
  });

  const clients = org?.members ?? [];
  const pendingInvites = org?.invites ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
      </div>

      {clients.length === 0 && pendingInvites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Users className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg font-medium">No clients yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Invite your first client to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {clients.length} clients
              {pendingInvites.length > 0 && ` • ${pendingInvites.length} pending`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{client.name ?? "No name"}</p>
                    <p className="text-xs text-gray-500">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {client._count.transactions} txns
                    </Badge>
                  </div>
                </Link>
              ))}
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-dashed p-3"
                >
                  <p className="text-sm text-gray-500">{invite.email}</p>
                  <Badge variant="outline">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
