"use client";

import { useState, useCallback } from "react";

export type UploadProgress = {
  fileName: string;
  percent: number;
};

function xhrPut(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection and try again"));
    xhr.send(file);
  });
}

async function uploadViaPresign(
  noteId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
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

  await xhrPut(uploadUrl, file, onProgress);

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

async function uploadDirect(
  noteId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("noteId", noteId);
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        let message = `Upload failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body.error) message = body.error;
        } catch { /* not JSON */ }
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection and try again"));
    xhr.send(formData);
  });
}

export function useUpload(noteId: string) {
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const upload = useCallback(async (files: File[]): Promise<void> => {
    if (files.length === 0) return;

    const usePresign = await fetch("/api/uploads/presign", { method: "HEAD" })
      .then((r) => r.status !== 404)
      .catch(() => false);

    for (const file of files) {
      setProgress({ fileName: file.name, percent: 0 });
      if (usePresign) {
        await uploadViaPresign(noteId, file, (pct) =>
          setProgress({ fileName: file.name, percent: pct }),
        );
      } else {
        await uploadDirect(noteId, file, (pct) =>
          setProgress({ fileName: file.name, percent: pct }),
        );
      }
    }

    setProgress(null);
  }, [noteId]);

  return { progress, upload };
}
