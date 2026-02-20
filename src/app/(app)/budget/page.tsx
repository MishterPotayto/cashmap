import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildSectionData, calculateWaterfall } from "@/lib/budget-calculator";
import { formatNZD, BUDGET_SECTION_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COLORS } from "@/lib/constants";

export const metadata = { title: "Budget" };

export default async function BudgetPage() {
  const user = await requireAuth();

  const budgetItems = await prisma.budgetItem.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
  });

  const items = budgetItems.map((i) => ({
    id: i.id,
    section: i.section,
    label: i.label,
    amount: Number(i.amount),
    frequency: i.frequency,
  }));

  const sections = buildSectionData(items, user.budgetPeriod);
  const waterfall = calculateWaterfall(sections);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Budget</h1>

      {/* Waterfall Summary */}
      <div className="grid gap-4 md:grid-cols-6">
        <WaterfallCard label="Income" value={waterfall.income} color={COLORS.success} />
        <WaterfallCard label="Bills" value={-waterfall.fixedCommitments} color={COLORS.danger} />
        <WaterfallCard label="Living" value={-waterfall.livingCosts} color={COLORS.warning} />
        <WaterfallCard label="One-off" value={-waterfall.oneOffCosts} color={COLORS.purple} />
        <WaterfallCard label="Extra" value={-waterfall.committedExtra} color={COLORS.teal} />
        <WaterfallCard label="Surplus" value={waterfall.discretionary} color={COLORS.primary} />
      </div>

      {/* Budget Sections */}
      {sections.map((section) => (
        <Card key={section.section}>
          <CardHeader>
            <CardTitle className="text-lg">
              {BUDGET_SECTION_LABELS[section.section]}
              <span className="ml-2 text-base font-normal text-gray-500">
                {formatNZD(section.total)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section.items.length === 0 ? (
              <p className="text-sm text-gray-500">
                No items yet. Add items via the budget API.
              </p>
            ) : (
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        {item.frequency.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatNZD(item.normalisedAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WaterfallCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 text-center">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold" style={{ color }}>
          {formatNZD(value)}
        </p>
      </CardContent>
    </Card>
  );
}
