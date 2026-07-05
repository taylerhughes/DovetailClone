"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNote } from "@/actions/notes";

export function NewNoteButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => createNote(projectId))}
    >
      <Plus data-icon="inline-start" />
      New note
    </Button>
  );
}
