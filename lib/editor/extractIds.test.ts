import { describe, expect, it } from "vitest";
import {
  extractHighlightMarks,
  extractHighlightEmbedIds,
  stripHighlightMark,
} from "./extractIds";

describe("extractHighlightMarks", () => {
  it("returns nothing for a doc with no highlights", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "plain" }] },
      ],
    };
    expect(extractHighlightMarks(doc)).toEqual([]);
  });

  it("reconstructs a quote split across multiple text runs", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "struggled to ",
              marks: [{ type: "highlight", attrs: { highlightId: "h1" } }],
            },
            {
              type: "text",
              text: "find settings",
              marks: [
                { type: "bold" },
                { type: "highlight", attrs: { highlightId: "h1" } },
              ],
            },
            { type: "text", text: " on launch" },
          ],
        },
      ],
    };
    expect(extractHighlightMarks(doc)).toEqual([
      { markId: "h1", quote: "struggled to find settings" },
    ]);
  });

  it("keeps distinct highlight ids separate at arbitrary nesting depth", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "first",
                  marks: [{ type: "highlight", attrs: { highlightId: "a" } }],
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "second",
                  marks: [{ type: "highlight", attrs: { highlightId: "b" } }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(extractHighlightMarks(doc)).toEqual([
      { markId: "a", quote: "first" },
      { markId: "b", quote: "second" },
    ]);
  });

  it("returns [] for an empty/undefined doc", () => {
    expect(extractHighlightMarks(undefined)).toEqual([]);
    expect(extractHighlightMarks({ type: "doc" })).toEqual([]);
  });
});

describe("extractHighlightEmbedIds", () => {
  it("finds embed node ids at any depth", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "highlightEmbed", attrs: { highlightId: "h1" } },
        {
          type: "paragraph",
          content: [{ type: "text", text: "commentary" }],
        },
        { type: "highlightEmbed", attrs: { highlightId: "h2" } },
      ],
    };
    expect(extractHighlightEmbedIds(doc)).toEqual(["h1", "h2"]);
  });
});

describe("stripHighlightMark", () => {
  it("removes only the targeted mark, leaving other marks and highlights intact", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "a",
              marks: [
                { type: "bold" },
                { type: "highlight", attrs: { highlightId: "remove-me" } },
              ],
            },
            {
              type: "text",
              text: "b",
              marks: [{ type: "highlight", attrs: { highlightId: "keep-me" } }],
            },
          ],
        },
      ],
    };
    const result = stripHighlightMark(doc, "remove-me");
    expect(extractHighlightMarks(result)).toEqual([
      { markId: "keep-me", quote: "b" },
    ]);
    expect(result.content?.[0]?.content?.[0]?.marks).toEqual([
      { type: "bold" },
    ]);
  });
});
