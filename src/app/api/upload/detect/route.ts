import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Papa from "papaparse";
import {
  hashHeaders,
  getCachedMapping,
  detectColumnsWithAI,
  cacheMapping,
  parseTransactions,
} from "@/lib/csv-parser";
import { formatNZD } from "@/lib/constants";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse(text, { skipEmptyLines: true });
  const rows = parsed.data as string[][];

  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const sampleRows = dataRows.slice(0, 5);

  // Check cache first
  const headerHash = hashHeaders(headers);
  let mapping = await getCachedMapping(headerHash);

  if (!mapping) {
    // AI detection
    mapping = await detectColumnsWithAI(headers, sampleRows);
    await cacheMapping(headerHash, mapping);
  }

  // Parse preview rows
  const previewTransactions = parseTransactions(sampleRows, headers, mapping);
  const preview = previewTransactions.map((t) => ({
    date: t.date.toLocaleDateString("en-NZ"),
    description: t.rawDescription,
    amount: formatNZD(t.amount),
    type: t.type,
  }));

  return NextResponse.json({
    mapping,
    preview,
    bankName: mapping.bankName ?? "Unknown",
    rowCount: dataRows.length,
  });
}
