import type { BudgetPeriod, Frequency } from "@/generated/prisma";
import type { WaterfallData, BudgetSectionData } from "@/lib/types";

/**
 * Normalise an amount from one frequency to a target budget period.
 * All calculations go through a fortnightly intermediate.
 */
export function normaliseAmount(
  amount: number,
  fromFrequency: Frequency,
  toBudgetPeriod: BudgetPeriod
): number {
  // Convert to fortnightly first (base unit)
  const fortnightly = toFortnightly(amount, fromFrequency);

  // Convert from fortnightly to target period
  switch (toBudgetPeriod) {
    case "WEEKLY":
      return fortnightly / 2;
    case "FORTNIGHTLY":
      return fortnightly;
    case "MONTHLY":
      return (fortnightly * 26) / 12;
    default:
      return fortnightly;
  }
}

/**
 * Convert any frequency amount to fortnightly.
 */
function toFortnightly(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case "WEEKLY":
      return amount * 2;
    case "FORTNIGHTLY":
      return amount;
    case "MONTHLY":
      return (amount * 12) / 26;
    case "QUARTERLY":
      return (amount * 4) / 26;
    case "ANNUALLY":
      return amount / 26;
    default:
      return amount;
  }
}

/**
 * Calculate the budget waterfall from section data.
 */
export function calculateWaterfall(
  sections: BudgetSectionData[]
): WaterfallData {
  const getTotal = (sectionName: string) =>
    sections.find((s) => s.section === sectionName)?.total ?? 0;

  const income = getTotal("INCOME");
  const fixedCommitments = getTotal("FIXED_COMMITMENTS");
  const livingCosts = getTotal("LIVING_COSTS");
  const oneOffCosts = getTotal("ONE_OFF_COSTS");
  const committedExtra = getTotal("COMMITTED_EXTRA");
  const discretionary =
    income - fixedCommitments - livingCosts - oneOffCosts - committedExtra;

  return {
    income,
    fixedCommitments,
    livingCosts,
    oneOffCosts,
    committedExtra,
    discretionary: Math.max(0, discretionary),
  };
}

/**
 * Build section data from raw budget items with normalisation.
 */
export function buildSectionData(
  items: {
    id?: string;
    section: string;
    label: string;
    amount: number;
    frequency: Frequency;
  }[],
  budgetPeriod: BudgetPeriod
): BudgetSectionData[] {
  const sections: BudgetSectionData[] = [
    "INCOME",
    "FIXED_COMMITMENTS",
    "LIVING_COSTS",
    "ONE_OFF_COSTS",
    "COMMITTED_EXTRA",
  ].map((section) => {
    const sectionItems = items
      .filter((i) => i.section === section)
      .map((i) => ({
        id: i.id,
        label: i.label,
        amount: i.amount,
        frequency: i.frequency,
        normalisedAmount: normaliseAmount(i.amount, i.frequency, budgetPeriod),
      }));

    return {
      section: section as BudgetSectionData["section"],
      items: sectionItems,
      total: sectionItems.reduce((sum, i) => sum + i.normalisedAmount, 0),
    };
  });

  return sections;
}
