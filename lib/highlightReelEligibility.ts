import type { Prisma } from "@/lib/generated/prisma/client";

/** A highlight is reel-eligible when it carries a clip range into a VIDEO attachment. Audio-only sources are excluded — ffmpeg's normalization step re-encodes to a video baseline, which has no audio-only equivalent. */
export const REEL_ELIGIBLE_HIGHLIGHT_WHERE = {
  attachmentId: { not: null },
  clipStartSec: { not: null },
  clipEndSec: { not: null },
  attachment: { kind: "VIDEO" },
} satisfies Prisma.HighlightWhereInput;

export function isReelEligibleHighlight(highlight: {
  attachmentId: string | null;
  clipStartSec: number | null;
  clipEndSec: number | null;
  attachmentKind: "VIDEO" | "AUDIO" | "IMAGE" | "FILE" | null;
}): boolean {
  return (
    highlight.attachmentId !== null &&
    highlight.clipStartSec !== null &&
    highlight.clipEndSec !== null &&
    highlight.attachmentKind === "VIDEO"
  );
}
