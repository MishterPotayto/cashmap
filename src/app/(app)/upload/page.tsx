"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, Sparkles, Loader2 } from "lucide-react";

type DetectionResult = {
  mapping: Record<string, unknown>;
  preview: { date: string; description: string; amount: string; type: string }[];
  bankName: string;
  rowCount: number;
};

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "detecting" | "confirm" | "processing" | "done">("upload");
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [result, setResult] = useState<{ imported: number; categorised: number } | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setError("");
    setStep("detecting");

    const formData = new FormData();
    formData.append("file", f);

    try {
      const res = await fetch("/api/upload/detect", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Detection failed");
      const data = await res.json();
      setDetection(data);
      setStep("confirm");
    } catch {
      setError("Failed to detect CSV format. Please try again.");
      setStep("upload");
    }
  }, []);

  async function confirmAndProcess() {
    if (!file || !detection) return;
    setStep("processing");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(detection.mapping));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Import failed");
      const data = await res.json();
      setResult(data);
      setStep("done");
    } catch {
      setError("Failed to import transactions.");
      setStep("confirm");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Upload CSV</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {step === "upload" && (
        <Card>
          <CardContent className="pt-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f && f.name.endsWith(".csv")) handleFile(f);
              }}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <Upload className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium">Drop your CSV file here</p>
              <p className="mt-1 text-sm text-gray-500">or click to browse</p>
              <input
                type="file"
                accept=".csv"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                style={{ position: "relative", marginTop: "16px" }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === "detecting" && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
            <p className="text-lg font-medium">Analysing CSV format...</p>
            <p className="text-sm text-gray-500">AI is detecting column structure</p>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && detection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Detected: {detection.bankName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {detection.preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3">{row.date}</td>
                      <td className="p-3">{row.description}</td>
                      <td className={`p-3 text-right font-medium ${
                        row.type === "CREDIT" ? "text-green-600" : ""
                      }`}>
                        {row.type === "CREDIT" ? "+" : "-"}{row.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500">
              {detection.rowCount} transactions found in {file?.name}
            </p>
            <div className="flex gap-3">
              <Button onClick={confirmAndProcess} className="bg-blue-600 hover:bg-blue-700">
                <Check className="mr-2 h-4 w-4" /> Looks correct — Import
              </Button>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Try different file
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "processing" && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
            <p className="text-lg font-medium">Importing & categorising...</p>
            <p className="text-sm text-gray-500">This may take a moment</p>
          </CardContent>
        </Card>
      )}

      {step === "done" && result && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <div className="mb-4 rounded-full bg-green-100 p-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-bold">Import Complete!</p>
            <p className="mt-2 text-sm text-gray-600">
              {result.imported} transactions imported • {result.categorised} auto-categorised
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => router.push("/transactions")} className="bg-blue-600 hover:bg-blue-700">
                <FileText className="mr-2 h-4 w-4" /> View Transactions
              </Button>
              <Button variant="outline" onClick={() => { setStep("upload"); setFile(null); }}>
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
