"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addHighlightTag } from "@/actions/highlights";
import { AiSuggestedTagsOverlay, type SuggestedTagAssignment } from "@/components/ai/AiSuggestedTagsOverlay";

export function SummarizeWithSuggestionsWrapper({ noteId }: { noteId: string }) {
  const [loading, setLoading] = useState(false);
  const [suggestedTagAssignments, setSuggestedTagAssignments] = useState<SuggestedTagAssignment[]>([]);
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
      if (!res.ok) {
        toast.error(data.error ?? "AI summarization failed");
        return;
      }
      if (Array.isArray(data.suggestedTagAssignments)) {
        setSuggestedTagAssignments(data.suggestedTagAssignments);
      }
      toast.success("Summary added to note");
      router.refresh();
    } catch {
      toast.error("AI summarization failed");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept(markId: string, tagId: string) {
    const assignment = suggestedTagAssignments.find((a) => a.markId === markId);
    if (!assignment) return;

    void addHighlightTag(assignment.highlightId, tagId).then(() => {
      setSuggestedTagAssignments((prev) =>
        prev
          .map((a) =>
            a.markId === markId
              ? { ...a, tags: a.tags.filter((t) => t.id !== tagId) }
              : a,
          )
          .filter((a) => a.tags.length > 0),
      );
      router.refresh();
    });
  }

  function handleReject(markId: string, tagId: string) {
    setSuggestedTagAssignments((prev) =>
      prev
        .map((a) =>
          a.markId === markId
            ? { ...a, tags: a.tags.filter((t) => t.id !== tagId) }
            : a,
        )
        .filter((a) => a.tags.length > 0),
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" disabled={loading} onClick={handleClick}>
        <Sparkles data-icon="inline-start" />
        {loading ? "Summarizing…" : "Summarize"}
      </Button>
      <AiSuggestedTagsOverlay
        suggestedTagAssignments={suggestedTagAssignments}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </>
  );
}
