import type {
  Role,
  BudgetPeriod,
  CategoryGroup,
  BudgetSection,
  Frequency,
  TransactionType,
  CategorisationMethod,
  MappingSource,
  GoalType,
  PlanStatus,
  PlanInterval,
  InviteStatus,
} from "@/generated/prisma";

export type {
  Role,
  BudgetPeriod,
  CategoryGroup,
  BudgetSection,
  Frequency,
  TransactionType,
  CategorisationMethod,
  MappingSource,
  GoalType,
  PlanStatus,
  PlanInterval,
  InviteStatus,
};

// ═══════════════════════════════════════
// SESSION
// ═══════════════════════════════════════

export interface SessionUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  organisationId: string | null;
  budgetPeriod: BudgetPeriod;
  onboardingCompleted: boolean;
}

// ═══════════════════════════════════════
// CSV PARSING
// ═══════════════════════════════════════

export interface ColumnMapping {
  dateColumn: string;
  dateFormat: string;
  descriptionColumns: string[];
  amountColumn: string;
  amountIsSignedNumber: boolean;
  debitColumn?: string | null;
  creditColumn?: string | null;
  typeColumn?: string | null;
  debitIndicator?: string | null;
  creditIndicator?: string | null;
  balanceColumn?: string | null;
  skipColumns: string[];
  bankName?: string | null;
  currency?: string;
  notes?: string | null;
}

export interface ParsedTransaction {
  date: Date;
  rawDescription: string;
  amount: number;
  type: TransactionType;
  hash: string;
}

export interface CsvDetectionResult {
  mapping: ColumnMapping;
  preview: {
    date: string;
    description: string;
    amount: string;
    type: TransactionType;
  }[];
  bankName: string;
  rowCount: number;
}

// ═══════════════════════════════════════
// CATEGORISATION
// ═══════════════════════════════════════

export interface CategorisationResult {
  categoryId: string;
  categoryName: string;
  displayName: string;
  method: CategorisationMethod;
}

// ═══════════════════════════════════════
// BUDGET
// ═══════════════════════════════════════

export interface BudgetSectionData {
  section: BudgetSection;
  items: {
    id?: string;
    label: string;
    amount: number;
    frequency: Frequency;
    normalisedAmount: number; // normalised to user's budget period
  }[];
  total: number;
}

export interface WaterfallData {
  income: number;
  fixedCommitments: number;
  livingCosts: number;
  oneOffCosts: number;
  committedExtra: number;
  discretionary: number; // calculated: income - all costs
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  surplus: number;
  transactionCount: number;
  categorisationRate: number;
  topCategories: { name: string; group: CategoryGroup; total: number }[];
}

// ═══════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════

export interface AdminStats {
  totalUsers: number;
  totalAdvisers: number;
  totalIndividuals: number;
  totalClients: number;
  totalTransactions: number;
  autoCatRate: number;
  mrr: number;
}
