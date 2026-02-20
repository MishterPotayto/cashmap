import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Sparkles,
  BarChart3,
  Target,
  ArrowRight,
  Check,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold">CashMap</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            See where your money{" "}
            <span className="text-blue-600">actually goes</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 md:text-xl">
            Upload your bank statement. Get instant insights. Take control of
            your budget with smart auto-categorisation and a visual money flow.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
            >
              <Link href="/register">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/register?role=adviser">
                I&apos;m a Financial Adviser
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Everything you need to manage your money
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-blue-600" />}
              title="Smart Categorisation"
              description="Auto-categorises NZ bank transactions using 160+ merchant rules and AI. Learns as you go."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-green-600" />}
              title="Budget Waterfall"
              description="See your money flow from income through bills, living costs, and into discretionary spending."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8 text-purple-600" />}
              title="Spending Insights"
              description="Charts, trends, and reports that show exactly where to save. Category breakdowns and patterns."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Simple pricing
          </h2>
          <p className="mt-4 text-center text-gray-600">
            Free for individuals. Pro for financial advisers.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Free</CardTitle>
                <div className="text-3xl font-bold">
                  $0<span className="text-base font-normal text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "CSV upload & auto-categorisation",
                    "Budget waterfall setup & view",
                    "Category spending reports",
                    "Up to 3 savings goals",
                    "6 months transaction history",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <span className="text-sm text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full" variant="outline">
                  <Link href="/register">Start Free</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                POPULAR
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Pro</CardTitle>
                <div className="text-3xl font-bold">
                  $29<span className="text-base font-normal text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Everything in Free",
                    "Client management dashboard",
                    "View all client budgets",
                    "Organisation mapping rules",
                    "Advanced reports & trends",
                    "Unlimited goals & history",
                    "No branding on exports",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                      <span className="text-sm text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-8 w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Link href="/register?role=adviser">Start Pro Trial</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">CashMap</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} CashMap. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="text-center">
      <CardContent className="pt-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}
