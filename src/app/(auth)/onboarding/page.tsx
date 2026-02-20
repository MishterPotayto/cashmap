"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, User, Briefcase, Building2, ArrowRight } from "lucide-react";

const steps = ["role", "period", "org", "done"] as const;
type Step = (typeof steps)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [budgetPeriod, setBudgetPeriod] = useState<string>("FORTNIGHTLY");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdviser = selectedRole === "ADVISER";

  async function completeOnboarding() {
    setLoading(true);
    try {
      await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole || "INDIVIDUAL",
          budgetPeriod,
          orgName: isAdviser ? orgName : undefined,
        }),
      });

      await update({
        role: selectedRole || "INDIVIDUAL",
        budgetPeriod,
        onboardingCompleted: true,
      });

      router.push("/dashboard");
    } catch {
      setLoading(false);
    }
  }

  function nextStep() {
    const idx = steps.indexOf(step);
    if (step === "role" && !isAdviser) {
      // Skip org step
      setStep("done");
      return;
    }
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <DollarSign className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold">CashMap</span>
          </div>
          <CardTitle className="text-lg">Let&apos;s get you set up</CardTitle>
        </CardHeader>
        <CardContent>
          {step === "role" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center mb-4">
                What best describes you?
              </p>
              <div className="grid gap-3">
                {[
                  { value: "INDIVIDUAL", label: "Individual", icon: User, desc: "Managing my own budget" },
                  { value: "ADVISER", label: "Financial Adviser", icon: Briefcase, desc: "Managing clients' budgets" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedRole(option.value)}
                    className={`flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
                      selectedRole === option.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <option.icon className="h-6 w-6 text-gray-600" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                onClick={nextStep}
                disabled={!selectedRole}
                className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "period" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center mb-4">
                How often do you get paid?
              </p>
              <div className="grid gap-3">
                {[
                  { value: "WEEKLY", label: "Weekly" },
                  { value: "FORTNIGHTLY", label: "Fortnightly" },
                  { value: "MONTHLY", label: "Monthly" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBudgetPeriod(option.value)}
                    className={`rounded-lg border-2 p-4 text-center transition-colors ${
                      budgetPeriod === option.value
                        ? "border-blue-600 bg-blue-50 font-medium"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Button
                onClick={nextStep}
                className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "org" && isAdviser && (
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <Building2 className="h-12 w-12 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Set up your organisation
              </p>
              <Input
                placeholder="Organisation name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <Button
                onClick={() => setStep("done")}
                disabled={!orgName}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4 text-center">
              <div className="text-4xl">🎉</div>
              <h3 className="text-lg font-semibold">You&apos;re all set!</h3>
              <p className="text-sm text-gray-600">
                Head to your dashboard to upload your first bank statement and
                start tracking your spending.
              </p>
              <Button
                onClick={completeOnboarding}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Setting up..." : "Go to Dashboard"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
