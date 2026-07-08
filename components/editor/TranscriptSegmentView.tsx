"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { formatTimestamp } from "@/lib/editor/timestamp";
import { seekMediaElement, subscribeToMediaTime } from "@/lib/editor/mediaRegistry";
import { SpeakerMapContext } from "@/components/editor/SpeakerMapContext";
import { TranscriptSpeaker } from "@/components/transcription/TranscriptSegment";
import type { WordData } from "@/lib/transcription/types";

export function TranscriptSegmentView({ node }: NodeViewProps) {
  const speakerMaps = useContext(SpeakerMapContext);
  const speaker = node.attrs.speaker as string | null;
  const startSec = node.attrs.startSec as number | null;
  const endSec = node.attrs.endSec as number | null;
  const attachmentId = node.attrs.attachmentId as string | null;
  const words = (node.attrs.words as WordData[] | null) ?? [];

  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Subscribe to playback time for this attachment
  useEffect(() => {
    if (!attachmentId) return;
    return subscribeToMediaTime(attachmentId, setCurrentTime);
  }, [attachmentId]);

  // Scroll active segment into view
  const isActive =
    currentTime !== null &&
    startSec !== null &&
    endSec !== null &&
    currentTime >= startSec &&
    currentTime < endSec;

  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  const teamMemberName = attachmentId && speaker
    ? speakerMaps.get(attachmentId)?.get(speaker)
    : undefined;

  const displayName = teamMemberName ?? speaker ?? "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  // Only show word-level overlay while video is playing (currentTime !== null).
  // When not playing, render normal NodeViewContent so ProseMirror selection works.
  const showWordOverlay = words.length > 0 && currentTime !== null;

  return (
    <NodeViewWrapper
      data-transcript-segment
      className="mt-6 first:mt-0 flex flex-col gap-2"
    >
      {/* inner div used for scrollIntoView — NodeViewWrapper doesn't forward refs */}
      <div ref={wrapperRef} />
      <div contentEditable={false} className="inline-flex items-center gap-2">
        <TranscriptSpeaker
          speakerName={displayName}
          speakerInitials={initials || undefined}
        />
        {startSec !== null && attachmentId && (
          <button
            type="button"
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => seekMediaElement(attachmentId, startSec)}
          >
            {formatTimestamp(startSec)}
          </button>
        )}
      </div>

      {showWordOverlay ? (
        <div className="relative">
          <div
            contentEditable={false}
            aria-hidden
            className="text-fs-100 font-type-body font-medium leading-type-normal"
          >
            {words.map((w, i) => {
              const isWordActive = currentTime >= w.startSec && currentTime < w.endSec;
              return (
                <span key={i}>
                  <span
                    className={
                      isWordActive
                        ? "rounded bg-yellow-200 text-yellow-900 dark:bg-yellow-400/30 dark:text-yellow-200 px-0.5"
                        : isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {w.text}
                  </span>
                  {i < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
          <NodeViewContent className="sr-only" />
        </div>
      ) : (
        <NodeViewContent className="text-fs-100 font-type-body font-medium text-muted-foreground leading-type-normal" />
      )}
    </NodeViewWrapper>
  );
}
