"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DraftInsightButton({
  projectId,
  highlightIds,
}: {
  projectId: string;
  highlightIds: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/draft-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, highlightIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "AI drafting failed");
        return;
      }
      router.push(`/projects/${projectId}/insights/${data.insightId}`);
    } catch {
      toast.error("AI drafting failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button disabled={loading || highlightIds.length === 0} onClick={handleClick}>
      <Sparkles data-icon="inline-start" />
      {loading
        ? "Drafting…"
        : `Draft insight from ${highlightIds.length} highlight${highlightIds.length === 1 ? "" : "s"}`}
    </Button>
  );
}
