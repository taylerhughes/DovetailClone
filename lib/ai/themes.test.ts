import { describe, expect, it, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("./client", () => ({
  getAnthropicClient: () => ({ messages: { create: createMock } }),
  MODELS: { tagging: "test-model", summarize: "test-model" },
}));

import { generateThemes } from "./themes";

const highlights = [
  { id: "h1", quote: "I got lost in the settings menu", tags: ["Navigation"] },
  { id: "h2", quote: "The settings page confused me", tags: [] },
  { id: "h3", quote: "Checkout was smooth", tags: ["Checkout"] },
];

beforeEach(() => {
  createMock.mockReset();
});

describe("generateThemes", () => {
  it("maps returned themes and keeps only valid highlight ids", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          input: {
            themes: [
              {
                title: "Settings confusion",
                description: "Users struggle to find settings.",
                highlightIds: ["h1", "h2"],
              },
              {
                title: "Checkout",
                description: "Checkout works well.",
                highlightIds: ["h3"],
              },
            ],
          },
        },
      ],
    });

    const result = await generateThemes(highlights);
    expect(result).toEqual([
      {
        title: "Settings confusion",
        description: "Users struggle to find settings.",
        highlightIds: ["h1", "h2"],
      },
      {
        title: "Checkout",
        description: "Checkout works well.",
        highlightIds: ["h3"],
      },
    ]);
  });

  it("drops highlight ids that weren't in the input set", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          input: {
            themes: [
              {
                title: "Made up theme",
                description: "...",
                highlightIds: ["h1", "h999-invented"],
              },
            ],
          },
        },
      ],
    });

    const result = await generateThemes(highlights);
    expect(result).toEqual([
      { title: "Made up theme", description: "...", highlightIds: ["h1"] },
    ]);
  });

  it("drops themes left with zero valid highlights", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          input: {
            themes: [
              { title: "Empty after filtering", description: "...", highlightIds: ["invented"] },
              { title: "Kept", description: "...", highlightIds: ["h1"] },
            ],
          },
        },
      ],
    });

    const result = await generateThemes(highlights);
    expect(result).toEqual([{ title: "Kept", description: "...", highlightIds: ["h1"] }]);
  });

  it("returns [] when the model response fails schema validation", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", input: { themes: "not an array" } }],
    });

    const result = await generateThemes(highlights);
    expect(result).toEqual([]);
  });

  it("returns [] when there is no tool_use block in the response", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "I refuse to use the tool." }],
    });

    const result = await generateThemes(highlights);
    expect(result).toEqual([]);
  });

  it("short-circuits without calling the API when there are no highlights", async () => {
    const result = await generateThemes([]);
    expect(result).toEqual([]);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("caps the number of returned themes", async () => {
    const manyThemes = Array.from({ length: 25 }, (_, i) => ({
      title: `Theme ${i}`,
      description: "...",
      highlightIds: ["h1"],
    }));
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", input: { themes: manyThemes } }],
    });

    const result = await generateThemes(highlights);
    expect(result).toHaveLength(20);
  });
});
