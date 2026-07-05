import { describe, expect, it } from "vitest";
import { Schema, Node as ProseMirrorNode } from "@tiptap/pm/model";
import { findTranscriptClipRange } from "./transcriptRange";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    transcriptSegment: {
      content: "inline*",
      group: "block",
      attrs: {
        speaker: { default: null },
        startSec: { default: null },
        endSec: { default: null },
        attachmentId: { default: null },
      },
    },
    text: { group: "inline" },
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDoc(json: any): ProseMirrorNode {
  return ProseMirrorNode.fromJSON(schema, json);
}

/** Finds the [from, to) position range of a text substring, for building test selections. */
function findTextRange(doc: ProseMirrorNode, text: string) {
  let from = -1;
  let to = -1;
  doc.descendants((node, pos) => {
    if (node.isText && node.text?.includes(text)) {
      const idx = node.text.indexOf(text);
      from = pos + idx;
      to = from + text.length;
    }
  });
  if (from === -1) throw new Error(`text not found: ${text}`);
  return { from, to };
}

describe("findTranscriptClipRange", () => {
  it("returns null for a selection outside any transcript segment", () => {
    const doc = buildDoc({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "plain text" }] },
      ],
    });
    const { from, to } = findTextRange(doc, "plain text");
    expect(findTranscriptClipRange(doc, from, to)).toBeNull();
  });

  it("returns the segment's range for a selection inside one segment", () => {
    const doc = buildDoc({
      type: "doc",
      content: [
        {
          type: "transcriptSegment",
          attrs: {
            speaker: "Speaker A",
            startSec: 10,
            endSec: 20,
            attachmentId: "att1",
          },
          content: [{ type: "text", text: "hello world" }],
        },
      ],
    });
    const { from, to } = findTextRange(doc, "world");
    expect(findTranscriptClipRange(doc, from, to)).toEqual({
      attachmentId: "att1",
      startSec: 10,
      endSec: 20,
    });
  });

  it("spans min/max across multiple covered segments from the same attachment", () => {
    const doc = buildDoc({
      type: "doc",
      content: [
        {
          type: "transcriptSegment",
          attrs: { speaker: "A", startSec: 0, endSec: 5, attachmentId: "att1" },
          content: [{ type: "text", text: "first" }],
        },
        {
          type: "transcriptSegment",
          attrs: { speaker: "B", startSec: 5, endSec: 10, attachmentId: "att1" },
          content: [{ type: "text", text: "second" }],
        },
      ],
    });
    const start = findTextRange(doc, "first").from;
    const end = findTextRange(doc, "second").to;
    expect(findTranscriptClipRange(doc, start, end)).toEqual({
      attachmentId: "att1",
      startSec: 0,
      endSec: 10,
    });
  });

  it("ignores a partially-selected second attachment's segment", () => {
    const doc = buildDoc({
      type: "doc",
      content: [
        {
          type: "transcriptSegment",
          attrs: { speaker: "A", startSec: 0, endSec: 5, attachmentId: "att1" },
          content: [{ type: "text", text: "from clip one" }],
        },
        {
          type: "transcriptSegment",
          attrs: { speaker: "B", startSec: 100, endSec: 105, attachmentId: "att2" },
          content: [{ type: "text", text: "from clip two" }],
        },
      ],
    });
    const start = findTextRange(doc, "from clip one").from;
    const end = findTextRange(doc, "from clip two").to;
    expect(findTranscriptClipRange(doc, start, end)).toEqual({
      attachmentId: "att1",
      startSec: 0,
      endSec: 5,
    });
  });
});
