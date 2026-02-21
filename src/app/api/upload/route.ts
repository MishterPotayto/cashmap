import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { parseTransactions } from "@/lib/csv-parser";
import { categoriseTransaction } from "@/lib/categorise";
import type { ColumnMapping } from "@/lib/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const mappingStr = formData.get("mapping") as string;

  if (!file || !mappingStr) {
    return NextResponse.json({ error: "Missing file or mapping" }, { status: 400 });
  }

  // Basic file validation
  if ((file as any).size && (file as any).size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  const mapping: ColumnMapping = JSON.parse(mappingStr);
  const text = await file.text();
  const parsed = Papa.parse(text, { skipEmptyLines: true });
  const rows = parsed.data as string[][];
  if (rows.length > 10001) {
    return NextResponse.json({ error: "CSV has more than 10,000 rows" }, { status: 413 });
  }
  const headers = rows[0];
  const dataRows = rows.slice(1);

  const transactions = parseTransactions(dataRows, headers, mapping);

  // Create CSV upload record
  const upload = await prisma.csvUpload.create({
    data: {
      userId: session.user.id,
      filename: file.name,
      bankFormat: mapping.bankName ?? "generic",
      transactionCount: transactions.length,
    },
  });

  // Get user's org for categorisation context
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organisationId: true },
  });

  // Deduplicate and import
  let imported = 0;
  let categorised = 0;

  for (const t of transactions) {
    // Check for duplicate
    const existing = await prisma.transaction.findFirst({
      where: { userId: session.user.id, hash: t.hash },
    });
    if (existing) continue;

    // Categorise
    const catResult = await categoriseTransaction(
      t.rawDescription,
      session.user.id,
      user?.organisationId
    );

    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        date: t.date,
        rawDescription: t.rawDescription,
        cleanedDescription: catResult?.displayName ?? null,
        amount: t.amount,
        type: t.type,
        categoryId: catResult?.categoryId ?? null,
        categorisationMethod: catResult?.method ?? null,
        csvUploadId: upload.id,
        hash: t.hash,
      },
    });

    imported++;
    if (catResult) categorised++;
  }

  // Update upload count
  await prisma.csvUpload.update({
    where: { id: upload.id },
    data: { transactionCount: imported },
  });

  return NextResponse.json({ imported, categorised });
}
