"use client";

import { useState, useTransition } from "react";
import { Share2, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setNoteShareLink, regenerateNoteShareLink } from "@/actions/noteSharing";

export function NoteShareButton({
  noteId,
  shareLinkEnabled: initialEnabled,
  shareLinkToken: initialToken,
}: {
  noteId: string;
  shareLinkEnabled: boolean;
  shareLinkToken: string | null;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [token, setToken] = useState(initialToken);
  const [, startTransition] = useTransition();

  const shareUrl =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/share/note/${token}`
      : null;

  function toggleLink() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const newToken = await setNoteShareLink(noteId, next);
      if (newToken) setToken(newToken);
    });
  }

  function handleRegenerate() {
    startTransition(async () => {
      const newToken = await regenerateNoteShareLink(noteId);
      setToken(newToken);
      toast.success("Link regenerated");
    });
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied");
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Share2 data-icon="inline-start" />
        Share
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share note</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <Text as="span" size={100}>Share link</Text>
              <Text as="span" size={75} color="subdued">
                Anyone with the link can view this note
              </Text>
            </div>
            <Button
              variant={enabled ? "default" : "outline"}
              size="sm"
              onClick={toggleLink}
            >
              {enabled ? "On" : "Off"}
            </Button>
          </div>

          {enabled && shareUrl && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-fs-75 leading-type-snug font-type-body">
              <span className="flex-1 truncate">{shareUrl}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Copy link"
                onClick={copyLink}
              >
                <Copy />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Regenerate link"
                onClick={handleRegenerate}
              >
                <RefreshCw />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
