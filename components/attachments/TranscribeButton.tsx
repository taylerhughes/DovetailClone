"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Captions, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { transcribeAttachment } from "@/actions/transcription";

const POLL_INTERVAL_MS = 2000;

type TranscriptionStatus = "NONE" | "PENDING" | "PROCESSING" | "DONE" | "FAILED";

function useElapsed(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return seconds;
}

function formatElapsed(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function TranscribeButton({
  attachmentId,
  initialStatus,
  initialError,
  autoStart = false,
  onDone,
}: {
  attachmentId: string;
  initialStatus: TranscriptionStatus;
  initialError: string | null;
  autoStart?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<TranscriptionStatus>(initialStatus);
  const [error, setError] = useState<string | null>(initialError);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInProgress = status === "PENDING" || status === "PROCESSING";
  const elapsed = useElapsed(isInProgress);

  // Auto-start transcription when the attachment is freshly uploaded
  useEffect(() => {
    if (autoStart && status === "NONE") {
      void handleClick();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isInProgress) return;

    pollTimer.current = setInterval(async () => {
      const res = await fetch(`/api/attachments/${attachmentId}/transcription-status`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
      setError(data.error ?? null);
      if (data.status === "DONE" || data.status === "FAILED") {
        if (pollTimer.current) clearInterval(pollTimer.current);
        if (data.status === "DONE") {
          startTransition(() => router.refresh());
          onDone?.();
        }
        if (data.status === "FAILED") toast.error(data.error ?? "Transcription failed");
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, attachmentId]);

  async function handleClick() {
    setStatus("PENDING");
    setError(null);
    try {
      await transcribeAttachment(attachmentId);
    } catch (err) {
      setStatus("FAILED");
      toast.error(err instanceof Error ? err.message : "Transcription failed");
    }
  }

  if (status === "DONE") return null;

  if (isInProgress) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">
            {status === "PENDING" ? "Queuing transcription…" : "Transcribing audio…"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatElapsed(elapsed)} elapsed · auto-updates when done
          </span>
        </div>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-destructive">Transcription failed</span>
            {error && <span className="text-xs text-muted-foreground">{error}</span>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleClick}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="self-start">
      <Captions data-icon="inline-start" />
      Transcribe
    </Button>
  );
}
