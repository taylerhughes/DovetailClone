"use client";

import { useRouter } from "next/navigation";
import { FileIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { toast } from "sonner";
import { registerMediaElement } from "@/lib/editor/mediaRegistry";
import { TranscribeButton } from "@/components/attachments/TranscribeButton";

type Attachment = {
  id: string;
  kind: "VIDEO" | "AUDIO" | "IMAGE" | "FILE";
  originalName: string;
  mimeType: string;
  transcriptionStatus: "NONE" | "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  transcriptionError: string | null;
};

export function MediaPlayer({
  attachment,
  transcriptionEnabled = false,
  compact = false,
}: {
  attachment: Attachment;
  transcriptionEnabled?: boolean;
  /** Removes card border/padding — for use inside a sticky sidebar */
  compact?: boolean;
}) {
  const router = useRouter();
  const src = `/api/attachments/${attachment.id}`;

  async function handleDelete() {
    const res = await fetch(`/api/attachments/${attachment.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to delete attachment");
      return;
    }
    router.refresh();
  }

  return (
    <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-2 rounded-lg border p-3"}>
      {!compact && (
        <div className="flex items-start justify-between gap-2">
          <Text as="span" size={75} color="subdued" className="line-clamp-1">{attachment.originalName}</Text>
          <div className="flex items-center gap-1">
            {transcriptionEnabled &&
              (attachment.kind === "VIDEO" || attachment.kind === "AUDIO") && (
                <TranscribeButton
                  attachmentId={attachment.id}
                  initialStatus={attachment.transcriptionStatus}
                  initialError={attachment.transcriptionError}
                />
              )}
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Delete attachment"
              onClick={handleDelete}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      )}
      {attachment.kind === "VIDEO" && (
        <video
          src={src}
          controls
          data-attachment-id={attachment.id}
          className={compact ? "w-full rounded-lg bg-black aspect-video object-contain" : "max-h-80 w-full rounded"}
          ref={(el) => registerMediaElement(attachment.id, el)}
        />
      )}
      {attachment.kind === "AUDIO" && (
        <audio
          src={src}
          controls
          className="w-full"
          ref={(el) => registerMediaElement(attachment.id, el)}
        />
      )}
      {attachment.kind === "IMAGE" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={attachment.originalName}
          className="max-h-80 w-full rounded object-contain"
        />
      )}
      {attachment.kind === "FILE" && (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-fs-100 leading-type-normal font-type-body text-primary hover:underline"
        >
          <FileIcon className="size-4" />
          Download
        </a>
      )}
    </div>
  );
}
