"use client";

import { useContext } from "react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { formatTimestamp } from "@/lib/editor/timestamp";
import { seekMediaElement } from "@/lib/editor/mediaRegistry";
import { SpeakerMapContext } from "@/components/editor/SpeakerMapContext";
import { TranscriptSpeaker } from "@/components/transcription/TranscriptSegment";

export function TranscriptSegmentView({ node }: NodeViewProps) {
  const speakerMaps = useContext(SpeakerMapContext);
  const speaker = node.attrs.speaker as string | null;
  const startSec = node.attrs.startSec as number | null;
  const attachmentId = node.attrs.attachmentId as string | null;

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

  return (
    <NodeViewWrapper data-transcript-segment className="mt-6 first:mt-0 flex flex-col gap-2">
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
      <NodeViewContent className="text-fs-100 font-type-body font-medium text-muted-foreground leading-type-normal" />
    </NodeViewWrapper>
  );
}
