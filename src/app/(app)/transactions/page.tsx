import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatNZD, formatDate } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Transactions" };

export default async function TransactionsPage() {
  const user = await requireAuth();

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {transactions.length} transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-lg">No transactions yet</p>
              <p className="text-sm mt-1">Upload a CSV file to import your bank transactions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Method</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-3">
                        <div className="font-medium">
                          {t.cleanedDescription ?? t.rawDescription}
                        </div>
                        {t.cleanedDescription && t.cleanedDescription !== t.rawDescription && (
                          <div className="text-xs text-gray-400 truncate max-w-xs">
                            {t.rawDescription}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        {t.category ? (
                          <Badge variant="secondary">{t.category.name}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400">
                            Uncategorised
                          </Badge>
                        )}
                      </td>
                      <td className="py-3">
                        {t.categorisationMethod && (
                          <span className="text-xs text-gray-400">
                            {t.categorisationMethod.replace("_", " ")}
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3 text-right font-medium whitespace-nowrap ${
                          t.type === "CREDIT" ? "text-green-600" : ""
                        }`}
                      >
                        {t.type === "CREDIT" ? "+" : "-"}
                        {formatNZD(Number(t.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
