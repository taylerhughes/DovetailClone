"use client";

import { useRef } from "react";
import { updateNoteTitle } from "@/actions/notes";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

export function NoteTitle({
  noteId,
  initialTitle,
}: {
  noteId: string;
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
          void updateNoteTitle(noteId, value);
        }, 600);
      }}
      className={[
        "w-full bg-transparent text-fs-700 leading-type-tight font-type-heading font-bold outline-none placeholder:text-muted-foreground",
        "rounded-md px-2 py-1 -mx-2",
        "border border-transparent transition-colors",
        canEdit
          ? "hover:border-border hover:bg-muted/40 focus:border-border focus:bg-muted/40 focus:ring-2 focus:ring-ring/30 cursor-text"
          : "cursor-default select-none",
      ].join(" ")}
      placeholder="Untitled"
    />
  );
}
