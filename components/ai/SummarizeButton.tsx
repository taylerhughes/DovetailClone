"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SummarizeButton({ noteId }: { noteId: string }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/summarize-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "AI summarization failed");
        return;
      }
      setSummary(data.summary ?? null);
    } catch {
      toast.error("AI summarization failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" size="sm" disabled={loading} onClick={handleClick}>
        <Sparkles data-icon="inline-start" />
        {loading ? "Summarizing…" : "Summarize"}
      </Button>
      {summary && (
        <p className="rounded-md border bg-muted/50 p-2 text-sm">{summary}</p>
      )}
    </div>
  );
}
