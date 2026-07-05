"use client";

import { useState } from "react";
import { HighlightRow } from "@/components/highlights/HighlightRow";
import { DraftInsightButton } from "@/components/ai/DraftInsightButton";
import { cn } from "@/lib/utils";
import type { TagOption } from "@/components/tags/TagPicker";

export interface HighlightListItem {
  id: string;
  quote: string;
  wholeNote: boolean;
  orphaned: boolean;
  noteId: string;
  noteTitle: string;
  tagIds: string[];
}

export function HighlightsList({
  projectId,
  highlights,
  allTags,
  aiEnabled,
  layout = "list",
}: {
  projectId: string;
  highlights: HighlightListItem[];
  allTags: TagOption[];
  aiEnabled: boolean;
  layout?: "list" | "grid";
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className={cn(
        "pb-16",
        layout === "grid"
          ? "grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col gap-2",
      )}
    >
      {highlights.map((h) => (
        <div key={h.id} className="flex items-start gap-2">
          {aiEnabled && (
            <input
              type="checkbox"
              className="mt-4 size-4"
              aria-label={`Select highlight: ${h.quote}`}
              checked={selected.has(h.id)}
              onChange={() => toggle(h.id)}
            />
          )}
          <div className="flex-1">
            <HighlightRow
              projectId={projectId}
              allTags={allTags}
              showSourceLink
              aiEnabled={aiEnabled}
              highlight={h}
            />
          </div>
        </div>
      ))}

      {aiEnabled && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <DraftInsightButton projectId={projectId} highlightIds={[...selected]} />
        </div>
      )}
    </div>
  );
}
