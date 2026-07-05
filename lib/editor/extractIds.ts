import type { JSONContent } from "@tiptap/react";

export interface ExtractedHighlight {
  markId: string;
  quote: string;
}

/**
 * Walks a Tiptap JSON doc and reconstructs the quote text for every
 * `highlight` mark by concatenating the text runs that carry it (a single
 * highlighted span can be split into multiple text nodes at formatting
 * boundaries, e.g. part bold + part plain).
 */
export function extractHighlightMarks(
  doc: JSONContent | null | undefined,
): ExtractedHighlight[] {
  const quotesByMarkId = new Map<string, string[]>();

  function walk(node: JSONContent) {
    if (node.type === "text" && node.text) {
      const mark = node.marks?.find((m) => m.type === "highlight");
      const highlightId = mark?.attrs?.highlightId as string | undefined;
      if (highlightId) {
        if (!quotesByMarkId.has(highlightId)) {
          quotesByMarkId.set(highlightId, []);
        }
        quotesByMarkId.get(highlightId)!.push(node.text);
      }
    }
    if (node.content) {
      for (const child of node.content) walk(child);
    }
  }

  if (doc) walk(doc);

  return Array.from(quotesByMarkId.entries()).map(([markId, parts]) => ({
    markId,
    quote: parts.join(""),
  }));
}

/** Extracts the set of `highlightId`s referenced by `highlightEmbed` atom nodes (used in Insights). */
export function extractHighlightEmbedIds(
  doc: JSONContent | null | undefined,
): string[] {
  const ids: string[] = [];

  function walk(node: JSONContent) {
    if (node.type === "highlightEmbed" && node.attrs?.highlightId) {
      ids.push(node.attrs.highlightId as string);
    }
    if (node.content) {
      for (const child of node.content) walk(child);
    }
  }

  if (doc) walk(doc);

  return ids;
}

/** Extracts the distinct `speaker` labels used by `transcriptSegment` nodes for a given attachment, in first-seen order. */
export function extractTranscriptSpeakers(
  doc: JSONContent | null | undefined,
  attachmentId: string,
): string[] {
  const speakers: string[] = [];
  const seen = new Set<string>();

  function walk(node: JSONContent) {
    if (
      node.type === "transcriptSegment" &&
      node.attrs?.attachmentId === attachmentId &&
      node.attrs?.speaker &&
      !seen.has(node.attrs.speaker)
    ) {
      seen.add(node.attrs.speaker);
      speakers.push(node.attrs.speaker as string);
    }
    if (node.content) {
      for (const child of node.content) walk(child);
    }
  }

  if (doc) walk(doc);

  return speakers;
}

/** Removes a `highlight` mark (by id) from every text run in the doc, in place-safe (returns a new doc). */
export function stripHighlightMark(
  doc: JSONContent,
  markId: string,
): JSONContent {
  function walk(node: JSONContent): JSONContent {
    const next: JSONContent = { ...node };
    if (next.marks) {
      next.marks = next.marks.filter(
        (m) => !(m.type === "highlight" && m.attrs?.highlightId === markId),
      );
    }
    if (next.content) {
      next.content = next.content.map(walk);
    }
    return next;
  }
  return walk(doc);
}
