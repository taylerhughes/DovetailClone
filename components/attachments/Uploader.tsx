"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

export function Uploader({ noteId }: { noteId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { canEdit } = useProjectAccess();

  if (!canEdit) return null;

  async function uploadViaPresign(file: File) {
    // Step 1: get presigned URL
    let presignRes: Response;
    try {
      presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });
    } catch {
      throw new Error("Upload failed — check your connection and try again");
    }

    if (!presignRes.ok) {
      const text = await presignRes.text().catch(() => "");
      let message = `Upload failed (${presignRes.status})`;
      try {
        const body = JSON.parse(text);
        if (body.error) message = body.error;
      } catch { /* not JSON */ }
      throw new Error(message);
    }

    const { uploadUrl, storageKey } = await presignRes.json();

    // Step 2: PUT file directly to S3
    try {
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!s3Res.ok) {
        throw new Error(`S3 upload failed (${s3Res.status})`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("S3")) throw err;
      throw new Error("Upload failed — check your connection and try again");
    }

    // Step 3: confirm with our server to create the DB record
    let confirmRes: Response;
    try {
      confirmRes = await fetch("/api/uploads/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId,
          storageKey,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });
    } catch {
      throw new Error("Upload confirmed on S3 but failed to save — please contact support");
    }

    if (!confirmRes.ok) {
      const text = await confirmRes.text().catch(() => "");
      let message = `Upload failed (${confirmRes.status})`;
      try {
        const body = JSON.parse(text);
        if (body.error) message = body.error;
      } catch { /* not JSON */ }
      throw new Error(message);
    }
  }

  async function uploadDirect(file: File) {
    const formData = new FormData();
    formData.append("noteId", noteId);
    formData.append("file", file);

    let res: Response;
    try {
      res = await fetch("/api/uploads", { method: "POST", body: formData });
    } catch {
      throw new Error("Upload failed — check your connection and try again");
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let message = `Upload failed (${res.status})`;
      try {
        const body = JSON.parse(text);
        if (body.error) message = body.error;
      } catch { /* not JSON */ }
      throw new Error(message);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      // Probe once: presigned uploads are available when STORAGE_DRIVER=s3 on the server.
      // When available we bypass App Runner's ~6MB body limit by uploading directly to S3.
      const usePresign = await fetch("/api/uploads/presign", { method: "HEAD" })
        .then((r) => r.status !== 404)
        .catch(() => false);

      for (const file of Array.from(files)) {
        if (usePresign) {
          await uploadViaPresign(file);
        } else {
          await uploadDirect(file);
        }
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

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
      >
        <Paperclip data-icon="inline-start" />
        {isUploading ? "Uploading…" : "Attach file"}
      </Button>
    </>
  );
}
