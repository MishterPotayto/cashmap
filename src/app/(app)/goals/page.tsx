import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatNZD } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

export const metadata = { title: "Goals" };

export default async function GoalsPage() {
  const user = await requireAuth();

  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Target className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">No goals yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Set savings targets to track your progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const pct =
              Number(goal.targetAmount) > 0
                ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
                : 0;
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                  <p className="text-xs text-gray-500">
                    {goal.type.replace("_", " ")}
                    {goal.targetDate &&
                      ` • Target: ${new Date(goal.targetDate).toLocaleDateString("en-NZ")}`}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{formatNZD(Number(goal.currentAmount))}</span>
                      <span className="text-gray-500">
                        of {formatNZD(Number(goal.targetAmount))}
                      </span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-3" />
                    <p className="text-right text-xs text-gray-500">
                      {pct.toFixed(1)}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
