"use client";

import { useRef } from "react";
import { updateInsightTitle } from "@/actions/insights";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

export function InsightTitle({
  insightId,
  initialTitle,
}: {
  insightId: string;
  initialTitle: string;
}) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { canEdit } = useProjectAccess();

  return (
    <input
      defaultValue={initialTitle}
      readOnly={!canEdit}
      onChange={(e) => {
        if (!canEdit) return;
        const value = e.target.value;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          void updateInsightTitle(insightId, value);
        }, 600);
      }}
      className="w-full border-none bg-transparent text-fs-700 leading-type-tight font-type-heading font-bold outline-none placeholder:text-muted-foreground"
      placeholder="Untitled insight"
    />
  );
}
