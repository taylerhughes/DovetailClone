"use client";

import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaybackMode } from "@/components/playback/PlaybackMode";
import type { TranscriptSegmentData } from "@/lib/editor/extractTranscriptSegments";

interface SegmentHighlight {
  id: string;
  clipStartSec: number | null;
  clipEndSec: number | null;
  tags: { id: string; name: string; color: string }[];
}

export function PlaybackModeButton({
  attachment,
  segments,
  highlights,
  speakerDisplayNames,
}: {
  attachment: { id: string; originalName: string };
  segments: TranscriptSegmentData[];
  highlights: SegmentHighlight[];
  speakerDisplayNames: Map<string, string>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Clapperboard data-icon="inline-start" />
        Playback
      </Button>

      {open && (
        <PlaybackMode
          attachment={attachment}
          segments={segments}
          highlights={highlights}
          speakerDisplayNames={speakerDisplayNames}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
