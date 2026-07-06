import { describe, expect, it, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("./client", () => ({
  getAnthropicClient: () => ({ messages: { create: createMock } }),
  MODELS: { tagging: "test-model", summarize: "test-model" },
}));

import { detectConflicts } from "./conflicts";

const candidates = [
  { subjectType: "HIGHLIGHT" as const, subjectId: "h1", text: "users actually loved the flow" },
  { subjectType: "INSIGHT" as const, subjectId: "i1", text: "unrelated insight about pricing" },
];

beforeEach(() => {
  createMock.mockReset();
});

describe("detectConflicts", () => {
  it("returns conflicts for valid candidates", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          input: {
            conflicts: [
              {
                subjectType: "HIGHLIGHT",
                subjectId: "h1",
                severity: "HIGH",
                explanation: "This contradicts the insight's claim that users struggled.",
              },
            ],
          },
        },
      ],
    });

    const result = await detectConflicts("Users struggle with onboarding", "text", candidates);
    expect(result).toEqual([
      {
        subjectType: "HIGHLIGHT",
        subjectId: "h1",
        severity: "HIGH",
        explanation: "This contradicts the insight's claim that users struggled.",
      },
    ]);
  });

  it("drops conflicts that reference ids not in the candidate set", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          input: {
            conflicts: [
              {
                subjectType: "HIGHLIGHT",
                subjectId: "invented",
                severity: "LOW",
                explanation: "...",
              },
            ],
          },
        },
      ],
    });

    const result = await detectConflicts("Title", "text", candidates);
    expect(result).toEqual([]);
  });

  it("returns [] when the model finds no conflicts", async () => {
    createMock.mockResolvedValue({ content: [{ type: "tool_use", input: { conflicts: [] } }] });
    const result = await detectConflicts("Title", "text", candidates);
    expect(result).toEqual([]);
  });

  it("returns [] when the model response fails schema validation", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", input: { conflicts: "not an array" } }],
    });
    const result = await detectConflicts("Title", "text", candidates);
    expect(result).toEqual([]);
  });

  it("returns [] when there is no tool_use block in the response", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "I refuse to use the tool." }],
    });
    const result = await detectConflicts("Title", "text", candidates);
    expect(result).toEqual([]);
  });

  it("short-circuits without calling the API when there are no candidates", async () => {
    const result = await detectConflicts("Title", "text", []);
    expect(result).toEqual([]);
    expect(createMock).not.toHaveBeenCalled();
  });
});
