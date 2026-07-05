import { describe, expect, it, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("./client", () => ({
  getAnthropicClient: () => ({ messages: { create: createMock } }),
  MODELS: { tagging: "test-model", summarize: "test-model" },
}));

import { suggestTags } from "./tagging";

const existingTags = [
  { id: "t1", name: "Onboarding" },
  { id: "t2", name: "Navigation" },
];

beforeEach(() => {
  createMock.mockReset();
});

describe("suggestTags", () => {
  it("matches suggested tag names back to existing tags case-insensitively", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          input: {
            tags: [
              { tagName: "onboarding", confidence: 0.9 },
              { tagName: "NAVIGATION", confidence: 0.4 },
            ],
          },
        },
      ],
    });

    const result = await suggestTags("some note text", existingTags);
    expect(result).toEqual([
      { tagId: "t1", confidence: 0.9 },
      { tagId: "t2", confidence: 0.4 },
    ]);
  });

  it("drops suggestions that don't match any existing tag name", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          input: {
            tags: [{ tagName: "Made Up Tag", confidence: 0.7 }],
          },
        },
      ],
    });

    const result = await suggestTags("some note text", existingTags);
    expect(result).toEqual([]);
  });

  it("returns [] when the model response fails schema validation", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", input: { tags: "not an array" } }],
    });

    const result = await suggestTags("some note text", existingTags);
    expect(result).toEqual([]);
  });

  it("returns [] when there is no tool_use block in the response", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "I refuse to use the tool." }],
    });

    const result = await suggestTags("some note text", existingTags);
    expect(result).toEqual([]);
  });

  it("short-circuits without calling the API when there are no existing tags", async () => {
    const result = await suggestTags("some note text", []);
    expect(result).toEqual([]);
    expect(createMock).not.toHaveBeenCalled();
  });
});
