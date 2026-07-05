"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNote } from "@/actions/notes";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

export function NewNoteButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const { canEdit } = useProjectAccess();

  if (!canEdit) return null;

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
