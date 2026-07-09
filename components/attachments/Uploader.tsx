"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";
import { useUpload } from "@/lib/uploads/useUpload";

export function Uploader({ noteId }: { noteId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { canEdit } = useProjectAccess();
  const { progress, upload } = useUpload(noteId);

  if (!canEdit) return null;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      await upload(Array.from(files));
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isUploading = progress !== null;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="relative overflow-hidden"
      >
        {isUploading && (
          <span
            className="pointer-events-none absolute inset-0 origin-left bg-primary/10 transition-[width]"
            style={{ width: `${progress.percent}%` }}
          />
        )}
        <Paperclip data-icon="inline-start" />
        {isUploading ? `${progress.percent}%` : "Attach file"}
      </Button>
    </>
  );
}
