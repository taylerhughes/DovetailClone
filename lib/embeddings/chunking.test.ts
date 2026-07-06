import { describe, expect, it } from "vitest";
import { chunkPlainText } from "./chunking";

describe("chunkPlainText", () => {
  it("returns [] for empty input", () => {
    expect(chunkPlainText("")).toEqual([]);
    expect(chunkPlainText("   \n\n  ")).toEqual([]);
  });

  it("returns a single chunk for short text", () => {
    expect(chunkPlainText("Users got lost in the settings menu.")).toEqual([
      "Users got lost in the settings menu.",
    ]);
  });

  it("coalesces short adjacent paragraphs into one chunk", () => {
    const text = "Paragraph one.\n\nParagraph two.\n\nParagraph three.";
    const result = chunkPlainText(text, 1600);
    expect(result).toEqual(["Paragraph one.\n\nParagraph two.\n\nParagraph three."]);
  });

  it("splits into multiple chunks once the char cap is exceeded", () => {
    const long = "x".repeat(1000);
    const text = `${long}\n\n${long}\n\n${long}`;
    const result = chunkPlainText(text, 1600);
    expect(result.length).toBeGreaterThan(1);
    // every original paragraph must survive somewhere in the output
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(1600 + long.length);
    }
    expect(result.join("\n\n")).toContain(long);
  });

  it("respects a custom maxChars", () => {
    const text = "aaaa\n\nbbbb\n\ncccc";
    const result = chunkPlainText(text, 5);
    expect(result).toEqual(["aaaa", "bbbb", "cccc"]);
  });
});
