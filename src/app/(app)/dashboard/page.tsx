import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNZD } from "@/lib/constants";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Receipt,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireAuth();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [transactions, totalTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: startOfMonth } },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.transaction.count({ where: { userId: user.id } }),
  ]);

  const totalIncome = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const surplus = totalIncome - totalExpenses;
  const categorised = transactions.filter((t) => t.categoryId).length;
  const catRate =
    transactions.length > 0
      ? Math.round((categorised / transactions.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/upload">
            <Upload className="mr-2 h-4 w-4" /> Upload CSV
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Income"
          value={formatNZD(totalIncome)}
          icon={<ArrowUpRight className="h-5 w-5 text-green-600" />}
          subtitle="This month"
        />
        <SummaryCard
          title="Expenses"
          value={formatNZD(totalExpenses)}
          icon={<ArrowDownRight className="h-5 w-5 text-red-600" />}
          subtitle="This month"
        />
        <SummaryCard
          title="Surplus"
          value={formatNZD(surplus)}
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          subtitle={surplus >= 0 ? "Looking good" : "Over budget"}
        />
        <SummaryCard
          title="Transactions"
          value={totalTransactions.toString()}
          icon={<Receipt className="h-5 w-5 text-purple-600" />}
          subtitle={`${catRate}% categorised`}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Link
              href="/transactions"
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Upload className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p>No transactions yet</p>
                <p className="text-sm">Upload your first CSV to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {t.cleanedDescription ?? t.rawDescription}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t.category?.name ?? "Uncategorised"} •{" "}
                        {new Date(t.date).toLocaleDateString("en-NZ")}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        t.type === "CREDIT" ? "text-green-600" : "text-gray-900"
                      }`}
                    >
                      {t.type === "CREDIT" ? "+" : "-"}
                      {formatNZD(Number(t.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.filter((t) => t.type === "DEBIT" && t.category).length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>No spending data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  transactions
                    .filter((t) => t.type === "DEBIT" && t.category)
                    .reduce<Record<string, number>>((acc, t) => {
                      const cat = t.category!.name;
                      acc[cat] = (acc[cat] ?? 0) + Number(t.amount);
                      return acc;
                    }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([name, total]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm">{name}</span>
                      <span className="text-sm font-medium">{formatNZD(total)}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
