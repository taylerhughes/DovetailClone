"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createWholeNoteHighlight } from "@/actions/highlights";

export function WholeNoteHighlightButton({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await createWholeNoteHighlight(noteId);
          router.refresh();
        })
      }
    >
      <Highlighter data-icon="inline-start" />
      Highlight whole note
    </Button>
  );
}
