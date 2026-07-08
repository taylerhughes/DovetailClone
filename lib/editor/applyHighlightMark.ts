import type { JSONContent } from "@tiptap/react";

interface TextSegment {
  path: number[];   // indices into the content tree to reach the text node's parent
  index: number;    // index of the text node within its parent's content array
  start: number;    // global character offset where this text node begins
  end: number;      // global character offset where this text node ends
  node: JSONContent;
}

function collectTextSegments(
  node: JSONContent,
  path: number[],
  offset: { value: number },
  segments: TextSegment[],
) {
  if (node.type === "text" && typeof node.text === "string") {
    // This is a leaf text node — record it, but we need its index in parent
    // (handled by the parent loop below)
    return;
  }
  if (!Array.isArray(node.content)) return;

  for (let i = 0; i < node.content.length; i++) {
    const child = node.content[i];
    if (child.type === "text" && typeof child.text === "string") {
      const len = child.text.length;
      segments.push({
        path,
        index: i,
        start: offset.value,
        end: offset.value + len,
        node: child,
      });
      offset.value += len;
    } else {
      collectTextSegments(child, [...path, i], offset, segments);
    }
  }
}

function getNodeAt(root: JSONContent, path: number[]): JSONContent {
  let node = root;
  for (const i of path) {
    node = node.content![i];
  }
  return node;
}

/**
 * Traverses a ProseMirror JSONContent doc and applies a highlight mark to the
 * first occurrence of `quote`. Returns a new (mutated) copy of the doc.
 * Returns the original doc unchanged if the quote isn't found.
 */
export function applyHighlightMark(
  doc: JSONContent,
  quote: string,
  markId: string,
): JSONContent {
  if (!quote.trim()) return doc;

  const segments: TextSegment[] = [];
  const offset = { value: 0 };
  collectTextSegments(doc, [], offset, segments);

  // Build the full plain text to find the quote position
  const fullText = segments.map((s) => s.node.text as string).join("");
  const matchIndex = fullText.indexOf(quote);
  if (matchIndex === -1) return doc;

  const matchEnd = matchIndex + quote.length;
  const highlightMark = { type: "highlight", attrs: { highlightId: markId, ai: true, color: null } };

  // Deep clone to avoid mutating the input
  const result = JSON.parse(JSON.stringify(doc)) as JSONContent;

  // Find which segments overlap the match range
  const affected = segments.filter((s) => s.start < matchEnd && s.end > matchIndex);
  if (affected.length === 0) return doc;

  // Process affected segments in reverse order so indices stay stable during splice
  for (let ai = affected.length - 1; ai >= 0; ai--) {
    const seg = affected[ai];
    const parent = getNodeAt(result, seg.path);
    const textNode = parent.content![seg.index];
    const text = textNode.text as string;

    // Offsets within this text node
    const localStart = Math.max(0, matchIndex - seg.start);
    const localEnd = Math.min(text.length, matchEnd - seg.start);

    const existingMarks: JSONContent["marks"] = textNode.marks ?? [];
    const markedNode: JSONContent = {
      type: "text",
      text: text.slice(localStart, localEnd),
      marks: [...existingMarks, highlightMark],
    };

    const replacements: JSONContent[] = [];
    if (localStart > 0) {
      replacements.push({ type: "text", text: text.slice(0, localStart), marks: existingMarks.length ? existingMarks : undefined });
    }
    replacements.push(markedNode);
    if (localEnd < text.length) {
      replacements.push({ type: "text", text: text.slice(localEnd), marks: existingMarks.length ? existingMarks : undefined });
    }

    parent.content!.splice(seg.index, 1, ...replacements);
  }

  return result;
}
