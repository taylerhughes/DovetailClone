"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";
import { useUpload } from "@/lib/uploads/useUpload";
import { cn } from "@/lib/utils";

export function DropZone({ noteId }: { noteId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { canEdit } = useProjectAccess();
  const { progress, upload } = useUpload(noteId);
  const dragCounter = useRef(0);

  const isUploading = progress !== null;

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    try {
      await upload(arr);
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!canEdit) return null;

  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-14 transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
        isUploading && "pointer-events-none",
      )}
      onClick={() => !isUploading && inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounter.current += 1;
        setIsDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragCounter.current -= 1;
        if (dragCounter.current === 0) setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {isUploading ? (
        <div className="flex w-64 flex-col items-center gap-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Uploading <span className="font-medium text-foreground">{progress.fileName}</span>
            {" "}— {progress.percent}%
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className={cn(
            "flex size-12 items-center justify-center rounded-full border-2 transition-colors",
            isDragging ? "border-primary text-primary" : "border-border",
          )}>
            <Upload className="size-5" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {isDragging ? "Drop to upload" : "Drop files here or click to upload"}
          </p>
          <p className="text-xs">Video, audio, images, or any file</p>
        </div>
      )}
    </div>
  );
}
