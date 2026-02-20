export const APP_NAME = "CashMap";

// ═══════════════════════════════════════
// BRAND COLOURS
// ═══════════════════════════════════════

export const COLORS = {
  primary: "#1a56db",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  purple: "#7c3aed",
  teal: "#0d9488",
} as const;

export const CATEGORY_GROUP_COLORS: Record<string, string> = {
  INCOME: COLORS.success,
  BILLS: COLORS.danger,
  LIVING_COSTS: COLORS.warning,
  DISCRETIONARY: COLORS.purple,
  OTHER: "#6b7280",
};

// ═══════════════════════════════════════
// NZ FORMATTING
// ═══════════════════════════════════════

export function formatNZD(amount: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ═══════════════════════════════════════
// BUDGET PERIOD LABELS
// ═══════════════════════════════════════

export const BUDGET_PERIOD_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Fortnightly",
  MONTHLY: "Monthly",
};

export const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Fortnightly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUALLY: "Annually",
};

export const BUDGET_SECTION_LABELS: Record<string, string> = {
  INCOME: "Income",
  FIXED_COMMITMENTS: "Regular Fixed Commitments",
  LIVING_COSTS: "Budgeted Living Costs",
  ONE_OFF_COSTS: "One-Off / Anticipated Costs",
  COMMITTED_EXTRA: "Committed Extra",
};

// ═══════════════════════════════════════
// ROLE LABELS
// ═══════════════════════════════════════

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADVISER: "Adviser",
  INDIVIDUAL: "Individual",
  CLIENT: "Client",
};

// ═══════════════════════════════════════
// CATEGORY GROUP LABELS
// ═══════════════════════════════════════

export const CATEGORY_GROUP_LABELS: Record<string, string> = {
  INCOME: "Income",
  BILLS: "Bills",
  LIVING_COSTS: "Living Costs",
  DISCRETIONARY: "Discretionary",
  OTHER: "Other",
};
