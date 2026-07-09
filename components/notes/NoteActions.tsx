"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Trash2, Sparkles, Loader2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteNote } from "@/actions/notes";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

export function NoteActions({
  noteId,
  aiEnabled = false,
  onSummarize,
}: {
  noteId: string;
  aiEnabled?: boolean;
  onSummarize?: () => Promise<void>;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { canEdit } = useProjectAccess();

  async function handleSummarize() {
    if (!onSummarize) return;
    setIsSummarizing(true);
    try {
      await onSummarize();
    } finally {
      setIsSummarizing(false);
    }
  }

  if (!canEdit) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Note actions" />}
        >
          {isSummarizing ? <Loader2 className="animate-spin" /> : <MoreVertical />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {aiEnabled && (
            <>
              <DropdownMenuItem onClick={handleSummarize} disabled={isSummarizing}>
                <Sparkles /> Summarize note
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 /> Delete note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note</DialogTitle>
            <DialogDescription>
              This permanently deletes the note and its highlights. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => startDeleteTransition(() => deleteNote(noteId))}
            >
              {isDeleting ? "Deleting…" : "Delete note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
