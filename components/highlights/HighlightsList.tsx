"use client";

import { useState } from "react";
import { HighlightRow } from "@/components/highlights/HighlightRow";
import { DraftInsightButton } from "@/components/ai/DraftInsightButton";
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
}: {
  projectId: string;
  highlights: HighlightListItem[];
  allTags: TagOption[];
  aiEnabled: boolean;
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
    <div className="flex flex-col gap-2 pb-16">
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
