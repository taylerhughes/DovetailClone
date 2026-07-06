"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

export function RegenerateThemesButton({
  projectId,
  hasExistingThemes,
}: {
  projectId: string;
  hasExistingThemes: boolean;
}) {
  const router = useRouter();
  const { canEdit } = useProjectAccess();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!canEdit) return null;

  async function regenerate() {
    try {
      const res = await fetch("/api/ai/generate-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Theme generation failed");
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("Theme generation failed");
    }
  }

  function handleClick() {
    if (hasExistingThemes) {
      setConfirmOpen(true);
    } else {
      startTransition(regenerate);
    }
  }

  return (
    <>
      <Button disabled={isPending} onClick={handleClick}>
        <Sparkles data-icon="inline-start" />
        {isPending ? "Generating…" : "Regenerate themes"}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate themes</DialogTitle>
            <DialogDescription>
              This replaces the project&apos;s current set of themes with a freshly
              generated one. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button disabled={isPending} onClick={() => startTransition(regenerate)}>
              {isPending ? "Generating…" : "Regenerate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
