"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Captions } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { toast } from "sonner";
import { transcribeAttachment } from "@/actions/transcription";

const POLL_INTERVAL_MS = 2000;

type TranscriptionStatus = "NONE" | "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export function TranscribeButton({
  attachmentId,
  initialStatus,
  initialError,
}: {
  attachmentId: string;
  initialStatus: TranscriptionStatus;
  initialError: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<TranscriptionStatus>(initialStatus);
  const [error, setError] = useState<string | null>(initialError);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "PENDING" && status !== "PROCESSING") return;

    pollTimer.current = setInterval(async () => {
      const res = await fetch(
        `/api/attachments/${attachmentId}/transcription-status`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
      setError(data.error ?? null);
      if (data.status === "DONE" || data.status === "FAILED") {
        if (pollTimer.current) clearInterval(pollTimer.current);
        if (data.status === "DONE") router.refresh();
        if (data.status === "FAILED") {
          toast.error(data.error ?? "Transcription failed");
        }
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [status, attachmentId, router]);

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

  if (status === "DONE") {
    return (
      <Text as="span" size={75} color="subdued">Transcribed</Text>
    );
  }

  if (status === "PENDING" || status === "PROCESSING") {
    return (
      <Text as="span" size={75} color="subdued">Transcribing…</Text>
    );
  }

  return (
    <Button variant="ghost" size="icon-xs" aria-label="Transcribe" onClick={handleClick} title={error ?? undefined}>
      <Captions />
    </Button>
  );
}
