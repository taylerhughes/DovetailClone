import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface TranscriptClipRange {
  attachmentId: string;
  startSec: number;
  endSec: number;
}

/**
 * Finds the time range covered by `transcriptSegment` nodes overlapping a
 * selection, so a highlight created inside a transcript can carry the source
 * video/audio range it corresponds to. Returns null for a selection outside
 * any transcript segment (a normal text highlight).
 */
export function findTranscriptClipRange(
  doc: ProseMirrorNode,
  from: number,
  to: number,
): TranscriptClipRange | null {
  let attachmentId: string | null = null;
  let startSec: number | null = null;
  let endSec: number | null = null;

  doc.nodesBetween(from, to, (node) => {
    if (node.type.name !== "transcriptSegment") return;
    const attrs = node.attrs as {
      attachmentId?: string;
      startSec?: number;
      endSec?: number;
    };
    if (
      !attrs.attachmentId ||
      typeof attrs.startSec !== "number" ||
      typeof attrs.endSec !== "number"
    ) {
      return;
    }
    if (!attachmentId) attachmentId = attrs.attachmentId;
    if (attachmentId !== attrs.attachmentId) return;
    startSec = startSec === null ? attrs.startSec : Math.min(startSec, attrs.startSec);
    endSec = endSec === null ? attrs.endSec : Math.max(endSec, attrs.endSec);
  });

  if (attachmentId === null || startSec === null || endSec === null) return null;
  return { attachmentId, startSec, endSec };
}
