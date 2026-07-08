"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SummarizeButton({ noteId }: { noteId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/summarize-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error ?? "AI summarization failed");
        return;
      }
      toast.success("Summary added to note");
      router.refresh();
    } catch {
      toast.error("AI summarization failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={handleClick}>
      <Sparkles data-icon="inline-start" />
      {loading ? "Summarizing…" : "Summarize"}
    </Button>
  );
}
