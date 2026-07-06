import { describe, expect, it } from "vitest";
import {
  suggestTagsResultSchema,
  summarizeResultSchema,
  draftInsightResultSchema,
  generateThemesResultSchema,
} from "./schemas";

describe("suggestTagsResultSchema", () => {
  it("accepts a well-formed response", () => {
    const result = suggestTagsResultSchema.safeParse({
      tags: [{ tagName: "Onboarding", confidence: 0.8 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects confidence outside [0, 1]", () => {
    const result = suggestTagsResultSchema.safeParse({
      tags: [{ tagName: "Onboarding", confidence: 1.5 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing tags field", () => {
    const result = suggestTagsResultSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects malformed junk from a misbehaving model", () => {
    const result = suggestTagsResultSchema.safeParse({ tags: "not an array" });
    expect(result.success).toBe(false);
  });
});

describe("summarizeResultSchema", () => {
  it("accepts a string summary", () => {
    expect(summarizeResultSchema.safeParse({ summary: "A short summary." }).success).toBe(
      true,
    );
  });

  it("rejects a non-string summary", () => {
    expect(summarizeResultSchema.safeParse({ summary: 42 }).success).toBe(false);
  });
});

describe("draftInsightResultSchema", () => {
  it("accepts paragraphs with citedHighlightIds defaulted", () => {
    const result = draftInsightResultSchema.safeParse({
      title: "Onboarding confusion",
      paragraphs: [{ text: "Users struggled." }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paragraphs[0].citedHighlightIds).toEqual([]);
    }
  });

  it("rejects a response missing paragraphs", () => {
    const result = draftInsightResultSchema.safeParse({ title: "X" });
    expect(result.success).toBe(false);
  });
});

describe("generateThemesResultSchema", () => {
  it("accepts themes with highlightIds defaulted", () => {
    const result = generateThemesResultSchema.safeParse({
      themes: [{ title: "Onboarding confusion", description: "Users get lost." }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.themes[0].highlightIds).toEqual([]);
    }
  });

  it("rejects a response missing themes", () => {
    const result = generateThemesResultSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects malformed junk from a misbehaving model", () => {
    const result = generateThemesResultSchema.safeParse({ themes: "not an array" });
    expect(result.success).toBe(false);
  });
});
