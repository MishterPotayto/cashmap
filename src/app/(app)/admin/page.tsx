import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Receipt, Shield, BarChart3 } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireOwner();

  const [userCount, adviserCount, individualCount, clientCount, orgCount, txCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADVISER" } }),
      prisma.user.count({ where: { role: "INDIVIDUAL" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.organisation.count(),
      prisma.transaction.count(),
    ]);

  const categorisedCount = await prisma.transaction.count({
    where: { categoryId: { not: null } },
  });
  const catRate = txCount > 0 ? Math.round((categorisedCount / txCount) * 100) : 0;

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={userCount} />
        <StatCard icon={<Building2 className="h-5 w-5" />} label="Organisations" value={orgCount} />
        <StatCard icon={<Receipt className="h-5 w-5" />} label="Transactions" value={txCount} />
        <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Auto-Cat Rate" value={`${catRate}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<Shield className="h-5 w-5" />} label="Advisers" value={adviserCount} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Individuals" value={individualCount} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Clients" value={clientCount} />
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { href: "/admin/users", label: "User Management" },
          { href: "/admin/organisations", label: "Organisations" },
          { href: "/admin/plans", label: "Plans & Features" },
          { href: "/admin/mappings", label: "System Mappings" },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="cursor-pointer hover:border-blue-300 transition-colors">
              <CardContent className="pt-6 text-center">
                <p className="font-medium text-blue-600">{link.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sign-ups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">{u.name ?? "No name"}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium capitalize text-gray-500">{u.role.toLowerCase()}</span>
                  <p className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString("en-NZ")}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-lg bg-blue-100 p-2 text-blue-600">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
