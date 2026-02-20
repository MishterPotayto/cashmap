import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import type { CategorisationResult } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

/**
 * 3-tier categorisation engine + AI fallback.
 *
 * Resolution order for mapping rules:
 * 1. User's own rules (source=USER, userId matches)
 * 2. Organisation rules (source=ADVISER, organisationId matches)
 * 3. System rules (source=SYSTEM)
 * 4. AI-learned rules (source=AI_LEARNED)
 *
 * Within each source, priority order:
 * Priority 3 — Edge case overrides (checked FIRST)
 * Priority 1 — Exact merchant match (checked SECOND)
 * Priority 2 — Keyword/generic match (checked THIRD)
 */
export async function categoriseTransaction(
  description: string,
  userId: string,
  organisationId?: string | null
): Promise<CategorisationResult | null> {
  const upperDesc = description.toUpperCase();

  // Fetch all applicable rules, ordered by priority
  const rules = await prisma.mappingRule.findMany({
    where: {
      OR: [
        { userId, source: "USER" },
        ...(organisationId
          ? [{ organisationId, source: "ADVISER" as const }]
          : []),
        { source: "SYSTEM", organisationId: null, userId: null },
        { source: "AI_LEARNED", organisationId: null, userId: null },
      ],
    },
    include: { category: true },
    orderBy: { priority: "desc" }, // 3 first, then 1, then 2
  });

  // Group by priority for correct resolution
  const edgeCases = rules.filter((r) => r.priority === 3);
  const exactMerchants = rules.filter((r) => r.priority === 1);
  const keywords = rules.filter((r) => r.priority === 2);

  // Check edge cases first (priority 3)
  for (const rule of edgeCases) {
    if (upperDesc.includes(rule.lookupText.toUpperCase())) {
      return {
        categoryId: rule.categoryId,
        categoryName: rule.category.name,
        displayName: rule.displayName,
        method: "EDGE_CASE",
      };
    }
  }

  // Check exact merchants (priority 1)
  for (const rule of exactMerchants) {
    if (upperDesc.includes(rule.lookupText.toUpperCase())) {
      return {
        categoryId: rule.categoryId,
        categoryName: rule.category.name,
        displayName: rule.displayName,
        method: "EXACT_MERCHANT",
      };
    }
  }

  // Check keywords (priority 2)
  for (const rule of keywords) {
    if (upperDesc.includes(rule.lookupText.toUpperCase())) {
      return {
        categoryId: rule.categoryId,
        categoryName: rule.category.name,
        displayName: rule.displayName,
        method: "KEYWORD",
      };
    }
  }

  // AI fallback
  return categoriseWithAI(description);
}

/**
 * AI fallback categorisation using Claude.
 */
async function categoriseWithAI(
  description: string
): Promise<CategorisationResult | null> {
  try {
    const categories = await prisma.category.findMany({
      where: { isSystem: true },
    });
    const categoryList = categories
      .map((c) => `${c.name} (${c.group})`)
      .join(", ");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system:
        "You categorise bank transactions. Respond with ONLY a JSON object: {\"category\": \"exact category name\", \"displayName\": \"cleaned merchant name\"}",
      messages: [
        {
          role: "user",
          content: `Categorise this NZ bank transaction: "${description}"\n\nAvailable categories: ${categoryList}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    const result = JSON.parse(cleaned);

    const category = categories.find(
      (c) => c.name.toLowerCase() === result.category?.toLowerCase()
    );

    if (category) {
      return {
        categoryId: category.id,
        categoryName: category.name,
        displayName: result.displayName ?? description,
        method: "AI",
      };
    }
  } catch {
    // AI failed — return null (uncategorised)
  }

  return null;
}

/**
 * Batch categorise multiple transactions.
 */
export async function categoriseTransactions(
  descriptions: string[],
  userId: string,
  organisationId?: string | null
): Promise<(CategorisationResult | null)[]> {
  const results: (CategorisationResult | null)[] = [];

  for (const desc of descriptions) {
    const result = await categoriseTransaction(desc, userId, organisationId);
    results.push(result);
  }

  return results;
}

/**
 * Create an AI-learned mapping rule from a confirmed categorisation.
 */
export async function createLearnedRule(
  lookupText: string,
  displayName: string,
  categoryId: string
): Promise<void> {
  // Check if rule already exists
  const existing = await prisma.mappingRule.findFirst({
    where: {
      lookupText: { equals: lookupText, mode: "insensitive" },
      source: "AI_LEARNED",
    },
  });

  if (!existing) {
    await prisma.mappingRule.create({
      data: {
        lookupText,
        displayName,
        categoryId,
        priority: 1,
        source: "AI_LEARNED",
      },
    });
  }
}
