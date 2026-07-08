"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Text } from "@/components/ui/text";

const POLL_INTERVAL_MS = 2000;

type ReelStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export function HighlightReelCard({
  reel,
}: {
  reel: {
    id: string;
    name: string;
    status: ReelStatus;
    errorMessage: string | null;
    createdAt: string;
  };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(reel.status);
  const [errorMessage, setErrorMessage] = useState(reel.errorMessage);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "PENDING" && status !== "PROCESSING") return;

    pollTimer.current = setInterval(async () => {
      const res = await fetch(`/api/highlight-reels/${reel.id}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);
      setErrorMessage(data.errorMessage ?? null);
      if (data.status === "DONE" || data.status === "FAILED") {
        if (pollTimer.current) clearInterval(pollTimer.current);
        if (data.status === "DONE") router.refresh();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [status, reel.id, router]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <Text as="span" size={100} weight="medium">{reel.name}</Text>
        <Text as="span" size={75} color="subdued">
          {(status === "PENDING" || status === "PROCESSING") && "Generating…"}
          {status === "DONE" && "Ready"}
          {status === "FAILED" && "Failed"}
        </Text>
      </div>
      {status === "DONE" && (
        <video
          src={`/api/highlight-reels/${reel.id}`}
          controls
          className="max-h-80 w-full rounded"
        />
      )}
      {status === "FAILED" && errorMessage && (
        <Text size={75} className="text-destructive">{errorMessage}</Text>
      )}
    </div>
  );
}
