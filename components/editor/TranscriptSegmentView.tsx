"use client";

import { useContext } from "react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { formatTimestamp } from "@/lib/editor/timestamp";
import { seekMediaElement } from "@/lib/editor/mediaRegistry";
import { SpeakerMapContext } from "@/components/editor/SpeakerMapContext";

export function TranscriptSegmentView({ node }: NodeViewProps) {
  const speakerMaps = useContext(SpeakerMapContext);
  const speaker = node.attrs.speaker as string | null;
  const startSec = node.attrs.startSec as number | null;
  const attachmentId = node.attrs.attachmentId as string | null;

  const teamMemberName = attachmentId && speaker
    ? speakerMaps.get(attachmentId)?.get(speaker)
    : undefined;

  return (
    <NodeViewWrapper data-transcript-segment className="mt-3 first:mt-0">
      <div
        contentEditable={false}
        className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground"
      >
        {startSec !== null && attachmentId && (
          <button
            type="button"
            className="rounded bg-muted px-1.5 py-0.5 font-mono hover:text-foreground"
            onClick={() => seekMediaElement(attachmentId, startSec)}
          >
            {formatTimestamp(startSec)}
          </button>
        )}
        {speaker && <span>{teamMemberName ?? speaker}</span>}
      </div>
      <NodeViewContent className="text-sm" />
    </NodeViewWrapper>
  );
}
