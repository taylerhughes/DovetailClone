"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/tags/TagBadge";
import { toast } from "sonner";

export interface TagSuggestionOption {
  id: string;
  name: string;
  color: string;
}

export function SuggestTagsButton({
  projectId,
  text,
  allTags,
  assignedTagIds,
  onAccept,
}: {
  projectId: string;
  text: string;
  allTags: TagSuggestionOption[];
  assignedTagIds: string[];
  onAccept: (tagId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestedIds, setSuggestedIds] = useState<string[] | null>(null);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "AI suggestion failed");
        return;
      }
      setSuggestedIds(
        (data.suggestions as { tagId: string }[]).map((s) => s.tagId),
      );
    } catch {
      toast.error("AI suggestion failed");
    } finally {
      setLoading(false);
    }
  }

  const suggestions = (suggestedIds ?? [])
    .filter((id) => !assignedTagIds.includes(id))
    .map((id) => allTags.find((t) => t.id === id))
    .filter((t): t is TagSuggestionOption => !!t);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Suggest tags with AI"
        disabled={loading}
        onClick={handleClick}
      >
        <Sparkles />
      </Button>
      {suggestedIds !== null && suggestions.length === 0 && (
        <span className="text-xs text-muted-foreground">No suggestions</span>
      )}
      {suggestions.map((tag) => (
        <button key={tag.id} onClick={() => onAccept(tag.id)} title="Add suggested tag">
          <TagBadge name={tag.name} color={tag.color} />
        </button>
      ))}
    </div>
  );
}
