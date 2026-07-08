import type { JSONContent } from "@tiptap/react";
import type { WordData } from "@/lib/transcription/types";

export type { WordData };

export interface TranscriptSegmentData {
  speaker: string | null;
  startSec: number;
  endSec: number;
  text: string;
  words: WordData[];
}

function collectText(node: JSONContent): string {
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (!node.content) return "";
  return node.content.map(collectText).join("");
}

export function extractTranscriptSegments(
  doc: JSONContent | null | undefined,
  attachmentId: string,
): TranscriptSegmentData[] {
  const segments: TranscriptSegmentData[] = [];

  function walk(node: JSONContent) {
    if (
      node.type === "transcriptSegment" &&
      node.attrs?.attachmentId === attachmentId &&
      node.attrs?.startSec != null &&
      node.attrs?.endSec != null
    ) {
      segments.push({
        speaker: (node.attrs.speaker as string | null) ?? null,
        startSec: node.attrs.startSec as number,
        endSec: node.attrs.endSec as number,
        text: collectText(node),
        words: (node.attrs.words as WordData[] | null) ?? [],
      });
    }
    if (node.content) {
      for (const child of node.content) walk(child);
    }
  }

  if (doc) walk(doc);
  return segments;
}
