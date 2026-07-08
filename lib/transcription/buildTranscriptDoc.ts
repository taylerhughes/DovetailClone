import type { JSONContent } from "@tiptap/react";
import type { TranscriptUtteranceData } from "@/lib/transcription/types";

export function buildTranscriptSegments(
  utterances: TranscriptUtteranceData[],
  attachmentId: string,
): JSONContent[] {
  return utterances.map((u) => ({
    type: "transcriptSegment",
    attrs: {
      speaker: `Speaker ${u.speaker}`,
      startSec: u.startSec,
      endSec: u.endSec,
      attachmentId,
      words: u.words,
    },
    content: u.text ? [{ type: "text", text: u.text }] : [],
  }));
}

/** Appends transcript segments to a note's existing doc, never overwriting existing content. */
export function appendTranscriptToDoc(
  doc: JSONContent | null | undefined,
  segments: JSONContent[],
): JSONContent {
  const existingContent = doc?.type === "doc" ? (doc.content ?? []) : [];
  return {
    type: "doc",
    content: [...existingContent, ...segments],
  };
}
