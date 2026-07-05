"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
        <span className="text-sm font-medium">{reel.name}</span>
        <span className="text-xs text-muted-foreground">
          {(status === "PENDING" || status === "PROCESSING") && "Generating…"}
          {status === "DONE" && "Ready"}
          {status === "FAILED" && "Failed"}
        </span>
      </div>
      {status === "DONE" && (
        <video
          src={`/api/highlight-reels/${reel.id}`}
          controls
          className="max-h-80 w-full rounded"
        />
      )}
      {status === "FAILED" && errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
