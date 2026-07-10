"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { transcribeAttachment } from "@/actions/transcription";

const POLL_INTERVAL_MS = 2000;

type Status = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

/**
 * Invisible controller that auto-transcribes a freshly-uploaded attachment
 * and optionally auto-summarizes the note when transcription finishes.
 *
 * Rendered once per attachment that needs processing; unmounts itself when done.
 */
function AttachmentProcessor({
  attachmentId,
  noteId,
  autoSummarize,
  onSummarize,
  onFinished,
}: {
  attachmentId: string;
  noteId: string;
  autoSummarize: boolean;
  onSummarize: () => Promise<void>;
  onFinished: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function run() {
      try {
        await transcribeAttachment(attachmentId);
      } catch {
        toast.error("Auto-transcription failed");
        onFinished();
        return;
      }

      // Poll until done
      pollTimer.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/attachments/${attachmentId}/transcription-status`);
          if (!res.ok) return;
          const data = await res.json() as { status: Status; error?: string };

          if (data.status === "DONE") {
            clearInterval(pollTimer.current!);
            startTransition(() => router.refresh());
            if (autoSummarize) {
              // Small delay to let the router refresh settle before summarizing
              setTimeout(async () => {
                try {
                  await onSummarize();
                } catch {
                  // summarize errors already toasted internally
                }
                onFinished();
              }, 1500);
            } else {
              onFinished();
            }
          } else if (data.status === "FAILED") {
            clearInterval(pollTimer.current!);
            toast.error(data.error ?? "Transcription failed");
            onFinished();
          }
        } catch {
          // network hiccup — keep polling
        }
      }, POLL_INTERVAL_MS);
    }

    void run();

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

const STORAGE_KEY_PREFIX = "auto-process:";

export function AutoTranscribeController({
  noteId,
  autoSummarize,
  onSummarize,
  pendingAttachmentIds,
  onClearPending,
}: {
  noteId: string;
  autoSummarize: boolean;
  onSummarize: () => Promise<void>;
  pendingAttachmentIds: string[];
  onClearPending: () => void;
}) {
  const [processing, setProcessing] = useState<string[]>([]);

  useEffect(() => {
    if (pendingAttachmentIds.length === 0) return;
    setProcessing((prev) => [...new Set([...prev, ...pendingAttachmentIds])]);
    onClearPending();
    // persist in case of reload
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + noteId) ?? "[]") as string[];
    const merged = [...new Set([...stored, ...pendingAttachmentIds])];
    localStorage.setItem(STORAGE_KEY_PREFIX + noteId, JSON.stringify(merged));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAttachmentIds]);

  // On mount, restore any attachments that were pending before a reload
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + noteId) ?? "[]") as string[];
      if (stored.length > 0) {
        setProcessing(stored);
        localStorage.removeItem(STORAGE_KEY_PREFIX + noteId);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {processing.map((id) => (
        <AttachmentProcessor
          key={id}
          attachmentId={id}
          noteId={noteId}
          autoSummarize={autoSummarize}
          onSummarize={onSummarize}
          onFinished={() => setProcessing((prev) => prev.filter((x) => x !== id))}
        />
      ))}
    </>
  );
}
