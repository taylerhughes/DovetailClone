"use client";

import { useRef } from "react";
import { updateNoteTitle } from "@/actions/notes";

export function NoteTitle({
  noteId,
  initialTitle,
}: {
  noteId: string;
  initialTitle: string;
}) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <input
      defaultValue={initialTitle}
      onChange={(e) => {
        const value = e.target.value;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          void updateNoteTitle(noteId, value);
        }, 600);
      }}
      className="w-full border-none bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground"
      placeholder="Untitled"
    />
  );
}
