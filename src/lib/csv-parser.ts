import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { ColumnMapping, ParsedTransaction } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

/**
 * Generate a hash of CSV headers for format caching.
 */
export function hashHeaders(headers: string[]): string {
  const sorted = [...headers].map((h) => h.trim().toLowerCase()).sort().join("|");
  return crypto.createHash("md5").update(sorted).digest("hex");
}

/**
 * Check the bank format cache for a known mapping.
 */
export async function getCachedMapping(
  headerHash: string
): Promise<ColumnMapping | null> {
  const cached = await prisma.bankFormatCache.findUnique({
    where: { headerHash },
  });

  if (cached) {
    await prisma.bankFormatCache.update({
      where: { id: cached.id },
      data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
    });
    return cached.columnMapping as unknown as ColumnMapping;
  }

  return null;
}

/**
 * Use Claude AI to detect the column structure of a CSV file.
 */
export async function detectColumnsWithAI(
  headers: string[],
  sampleRows: string[][]
): Promise<ColumnMapping> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are a bank statement CSV parser. You analyse CSV headers and sample data rows to determine the structure of bank statement files. You must be accurate — people's financial data depends on this.`,
    messages: [
      {
        role: "user",
        content: `Here are the headers and first ${sampleRows.length} rows of a bank statement CSV. Analyse the structure and tell me which columns contain what data.

Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows)}

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "dateColumn": "exact column header name for the date",
  "dateFormat": "the date format used, e.g. dd/MM/yyyy or yyyy-MM-dd or d/MM/yyyy",
  "descriptionColumns": ["column1", "column2"],
  "amountColumn": "column header for the amount",
  "amountIsSignedNumber": true/false,
  "debitColumn": "column header if debits are in a separate column" or null,
  "creditColumn": "column header if credits are in a separate column" or null,
  "typeColumn": "column that contains debit/credit indicator" or null,
  "debitIndicator": "the text value that means debit" or null,
  "creditIndicator": "the text value that means credit" or null,
  "balanceColumn": "column for running balance" or null,
  "skipColumns": ["columns to ignore"],
  "bankName": "your best guess at the bank name, or 'Unknown'",
  "currency": "the likely currency code, e.g. NZD, AUD, USD, GBP",
  "notes": "any important parsing notes"
}

Rules:
- If amounts are negative for debits and positive for credits, set amountIsSignedNumber=true
- If there are separate Debit and Credit columns, set those and set amountIsSignedNumber=false
- If there's a Type/Direction column with values like D/C, set typeColumn and indicators
- For descriptionColumns: include ALL columns that contribute to identifying the merchant/transaction. Banks often use fields like "Other Party", "Payee", "Description", "Details", "Particulars", "Memo", "Narrative", etc. Combine them in order of usefulness.
- Ignore columns that are just internal reference numbers or running balances UNLESS they help identify the transaction.
- Look at the actual data values to determine the date format — check if day>12 to distinguish dd/MM from MM/dd.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned) as ColumnMapping;
}

/**
 * Cache a detected column mapping for future use.
 */
export async function cacheMapping(
  headerHash: string,
  mapping: ColumnMapping
): Promise<void> {
  await prisma.bankFormatCache.upsert({
    where: { headerHash },
    update: {
      columnMapping: mapping as unknown as Record<string, unknown>,
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
    create: {
      headerHash,
      bankName: mapping.bankName,
      columnMapping: mapping as unknown as Record<string, unknown>,
      currency: mapping.currency ?? "NZD",
    },
  });
}

/**
 * Parse a date string using a detected format.
 */
export function parseDateWithFormat(dateStr: string, format: string): Date {
  const clean = dateStr.trim();

  // Common formats
  if (format.includes("yyyy-MM-dd") || format.includes("YYYY-MM-DD")) {
    return new Date(clean);
  }

  const parts = clean.split(/[/\-\.]/);
  if (parts.length !== 3) return new Date(clean);

  const lowerFormat = format.toLowerCase();

  if (lowerFormat.startsWith("dd")) {
    // dd/MM/yyyy or dd-MM-yyyy
    const [day, month, year] = parts;
    return new Date(
      parseInt(year.length === 2 ? `20${year}` : year),
      parseInt(month) - 1,
      parseInt(day)
    );
  } else if (lowerFormat.startsWith("mm")) {
    // MM/dd/yyyy
    const [month, day, year] = parts;
    return new Date(
      parseInt(year.length === 2 ? `20${year}` : year),
      parseInt(month) - 1,
      parseInt(day)
    );
  } else if (lowerFormat.startsWith("d/")) {
    // d/MM/yyyy (no leading zero)
    const [day, month, year] = parts;
    return new Date(
      parseInt(year.length === 2 ? `20${year}` : year),
      parseInt(month) - 1,
      parseInt(day)
    );
  }

  return new Date(clean);
}

/**
 * Generate a dedup hash for a transaction.
 */
export function transactionHash(
  date: Date,
  amount: number,
  description: string
): string {
  const key = `${date.toISOString().split("T")[0]}_${amount}_${description}`;
  return crypto.createHash("md5").update(key).digest("hex");
}

/**
 * Parse all transactions from CSV rows using a confirmed column mapping.
 */
export function parseTransactions(
  rows: string[][],
  headers: string[],
  mapping: ColumnMapping
): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];

  for (const row of rows) {
    if (row.length < 2) continue; // Skip empty/malformed rows

    try {
      const dateIdx = headers.indexOf(mapping.dateColumn);
      const amountIdx = headers.indexOf(mapping.amountColumn);

      if (dateIdx === -1 || !row[dateIdx]) continue;

      // Combine description columns
      const description = mapping.descriptionColumns
        .map((col) => row[headers.indexOf(col)]?.trim())
        .filter(Boolean)
        .join(" - ");

      if (!description) continue;

      // Parse date
      const date = parseDateWithFormat(row[dateIdx], mapping.dateFormat);
      if (isNaN(date.getTime())) continue;

      // Parse amount and determine debit/credit
      let amount: number;
      let type: "DEBIT" | "CREDIT";

      if (mapping.amountIsSignedNumber) {
        amount = parseFloat(
          (row[amountIdx] ?? "0").replace(/[^0-9.\-]/g, "")
        );
        type = amount < 0 ? "DEBIT" : "CREDIT";
        amount = Math.abs(amount);
      } else if (mapping.debitColumn && mapping.creditColumn) {
        const debitIdx = headers.indexOf(mapping.debitColumn);
        const creditIdx = headers.indexOf(mapping.creditColumn);
        const debit = parseFloat(
          (row[debitIdx] ?? "0").replace(/[^0-9.\-]/g, "") || "0"
        );
        const credit = parseFloat(
          (row[creditIdx] ?? "0").replace(/[^0-9.\-]/g, "") || "0"
        );
        amount = debit || credit;
        type = debit > 0 ? "DEBIT" : "CREDIT";
      } else if (mapping.typeColumn) {
        amount = Math.abs(
          parseFloat((row[amountIdx] ?? "0").replace(/[^0-9.\-]/g, ""))
        );
        const typeIdx = headers.indexOf(mapping.typeColumn);
        const typeVal = row[typeIdx]?.trim().toUpperCase();
        type =
          typeVal === mapping.debitIndicator?.toUpperCase() ? "DEBIT" : "CREDIT";
      } else {
        amount = parseFloat(
          (row[amountIdx] ?? "0").replace(/[^0-9.\-]/g, "")
        );
        type = amount < 0 ? "DEBIT" : "CREDIT";
        amount = Math.abs(amount);
      }

      if (amount === 0 || isNaN(amount)) continue;

      const hash = transactionHash(date, amount, description);

      results.push({ date, rawDescription: description, amount, type, hash });
    } catch {
      // Skip malformed rows
      continue;
    }
  }

  return results;
}
