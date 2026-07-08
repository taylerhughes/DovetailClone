"use client";

import { useEffect, useRef, useState } from "react";
import { X, Play, Pause } from "lucide-react";
import { registerMediaElement, subscribeToMediaTime, setMediaPaused, seekMediaElement } from "@/lib/editor/mediaRegistry";
import { formatTimestamp } from "@/lib/editor/timestamp";
import { TagBadge } from "@/components/tags/TagBadge";
import type { TranscriptSegmentData } from "@/lib/editor/extractTranscriptSegments";

interface SegmentHighlight {
  id: string;
  clipStartSec: number | null;
  clipEndSec: number | null;
  tags: { id: string; name: string; color: string }[];
}

export function PlaybackMode({
  attachment,
  segments,
  highlights,
  speakerDisplayNames,
  onClose,
}: {
  attachment: { id: string; originalName: string };
  segments: TranscriptSegmentData[];
  highlights: SegmentHighlight[];
  speakerDisplayNames: Map<string, string>;
  onClose: () => void;
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Subscribe to time updates from the registry
  useEffect(() => {
    return subscribeToMediaTime(attachment.id, setCurrentTime);
  }, [attachment.id]);

  // Track play/pause state
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setMediaPaused(attachment.id, !paused);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [attachment.id, paused, onClose]);

  const activeSegment = segments.find(
    (s) => currentTime >= s.startSec && currentTime < s.endSec,
  ) ?? null;

  // Tags whose clip range overlaps the active segment
  const segmentTags = activeSegment
    ? highlights
        .filter(
          (h) =>
            h.clipStartSec != null &&
            h.clipEndSec != null &&
            h.clipStartSec < activeSegment.endSec &&
            h.clipEndSec > activeSegment.startSec,
        )
        .flatMap((h) => h.tags)
    : [];

  const displayName = activeSegment?.speaker
    ? (speakerDisplayNames.get(activeSegment.speaker) ?? activeSegment.speaker)
    : null;

  const initials = displayName
    ? displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : null;

  function togglePlayPause() {
    setMediaPaused(attachment.id, !paused);
  }

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    seekMediaElement(attachment.id, Number(e.target.value));
    setCurrentTime(Number(e.target.value));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Video */}
      <div className="relative min-h-0 flex-1">
        <video
          ref={(el) => {
            (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
            registerMediaElement(attachment.id, el);
          }}
          src={`/api/attachments/${attachment.id}`}
          className="h-full w-full object-contain"
          onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
          onClick={togglePlayPause}
        />
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Active segment display */}
      <div className="shrink-0 border-t border-white/10 bg-zinc-900 px-6 py-4" style={{ minHeight: "7rem" }}>
        {activeSegment ? (
          <div key={`${activeSegment.startSec}-${activeSegment.endSec}`} className="playback-segment-enter flex flex-col gap-2">
            {displayName && (
              <div className="flex items-center gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-[10px] font-bold text-white">
                  {initials}
                </div>
                <span className="text-sm font-medium text-zinc-300">{displayName}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {formatTimestamp(activeSegment.startSec)}
                </span>
              </div>
            )}
            <p className="text-sm leading-relaxed text-white">{activeSegment.text}</p>
            {segmentTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {segmentTags.map((tag) => (
                  <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            {segments.length === 0 ? "No transcript available" : "—"}
          </p>
        )}
      </div>

      {/* Controls bar */}
      <div className="shrink-0 bg-zinc-800 px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={togglePlayPause}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-zinc-200"
          >
            {paused ? <Play className="size-4 translate-x-px" /> : <Pause className="size-4" />}
          </button>

          {/* Time */}
          <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-400">
            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
          </span>

          {/* Scrubber */}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleScrub}
            className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-600 accent-white"
          />
        </div>
      </div>
    </div>
  );
}
