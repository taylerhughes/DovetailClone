"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { formatTimestamp } from "@/lib/editor/timestamp";
import { seekMediaElement } from "@/lib/editor/mediaRegistry";

export function ChapterMarkerView({ node }: NodeViewProps) {
  const title = node.attrs.title as string;
  const startSec = node.attrs.startSec as number | null;
  const attachmentId = node.attrs.attachmentId as string | null;

  function handleSeek() {
    if (attachmentId && startSec !== null) {
      seekMediaElement(attachmentId, startSec);
    }
  }

  return (
    <NodeViewWrapper contentEditable={false} data-chapter-marker>
      <div className="my-4 flex items-center gap-3 select-none">
        {/* Timestamp pill */}
        {startSec !== null && attachmentId ? (
          <button
            type="button"
            onClick={handleSeek}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground transition-colors"
          >
            <span className="inline-block size-2 rounded-sm bg-muted-foreground/60" />
            {formatTimestamp(startSec)}
          </button>
        ) : (
          <div className="h-px w-6 bg-border shrink-0" />
        )}

        {/* Rule */}
        <div className="h-px flex-1 bg-border" />

        {/* Chapter title */}
        {title && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="inline-block size-2 rounded-sm bg-muted-foreground/60" />
            {title}
          </span>
        )}
      </div>
    </NodeViewWrapper>
  );
}
