import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatNZD, CATEGORY_GROUP_LABELS, CATEGORY_GROUP_COLORS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await requireAuth();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      type: "DEBIT",
      date: { gte: startOfMonth },
    },
    include: { category: true },
  });

  const totalSpending = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  // Group by category
  const byCat = transactions.reduce<Record<string, { total: number; group: string }>>((acc, t) => {
    const name = t.category?.name ?? "Uncategorised";
    const group = t.category?.group ?? "OTHER";
    if (!acc[name]) acc[name] = { total: 0, group };
    acc[name].total += Number(t.amount);
    return acc;
  }, {});

  const sortedCats = Object.entries(byCat).sort(([, a], [, b]) => b.total - a.total);

  // Group by category group
  const byGroup = transactions.reduce<Record<string, number>>((acc, t) => {
    const group = t.category?.group ?? "OTHER";
    acc[group] = (acc[group] ?? 0) + Number(t.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Group Summary */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(byGroup)
          .sort(([, a], [, b]) => b - a)
          .map(([group, total]) => (
            <Card key={group}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-gray-500">
                  {CATEGORY_GROUP_LABELS[group] ?? group}
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: CATEGORY_GROUP_COLORS[group] ?? "#6b7280" }}
                >
                  {formatNZD(total)}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Spending by Category
            <span className="ml-2 text-base font-normal text-gray-500">
              This month • {formatNZD(totalSpending)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCats.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No spending data this month.
            </p>
          ) : (
            <div className="space-y-4">
              {sortedCats.map(([name, { total, group }]) => {
                const pct = totalSpending > 0 ? (total / totalSpending) * 100 : 0;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <span>
                        {formatNZD(total)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className="h-2"
                      style={
                        {
                          "--progress-color":
                            CATEGORY_GROUP_COLORS[group] ?? "#6b7280",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
