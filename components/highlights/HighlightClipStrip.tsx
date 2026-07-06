"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { TagBadge } from "@/components/tags/TagBadge";
import { formatTimestamp } from "@/lib/editor/timestamp";
import { seekMediaElement } from "@/lib/editor/mediaRegistry";

type ClipHighlight = {
  id: string;
  quote: string;
  clipStartSec: number;
  tags: { id: string; name: string; color: string }[];
};

export function HighlightClipStrip({
  attachmentId,
  highlights,
}: {
  attachmentId: string;
  highlights: ClipHighlight[];
}) {
  if (highlights.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {highlights.map((highlight) => (
        <ClipCard
          key={highlight.id}
          attachmentId={attachmentId}
          highlight={highlight}
        />
      ))}
    </div>
  );
}

function ClipCard({
  attachmentId,
  highlight,
}: {
  attachmentId: string;
  highlight: ClipHighlight;
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  return (
    <button
      type="button"
      title={highlight.quote}
      onClick={() => seekMediaElement(attachmentId, highlight.clipStartSec)}
      className="flex w-32 shrink-0 flex-col gap-1 text-left"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
        {thumbnailFailed ? (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="size-6 text-muted-foreground" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/highlights/${highlight.id}/thumbnail`}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setThumbnailFailed(true)}
          />
        )}
        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white">
          {formatTimestamp(highlight.clipStartSec)}
        </span>
      </div>
      {highlight.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {highlight.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      )}
    </button>
  );
}
