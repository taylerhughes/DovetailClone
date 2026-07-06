import { describe, expect, it, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("./client", () => ({
  getAnthropicClient: () => ({ messages: { create: createMock } }),
  MODELS: { tagging: "test-model", summarize: "test-model" },
}));

import { answerResearchQuestion } from "./chat";

const candidates = [
  { subjectType: "HIGHLIGHT" as const, subjectId: "h1", text: "users got lost in settings" },
  { subjectType: "NOTE" as const, subjectId: "n1", text: "onboarding session transcript" },
];

beforeEach(() => {
  createMock.mockReset();
});

describe("answerResearchQuestion", () => {
  it("returns the answer with valid citations", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          input: {
            answer: "Users struggled with the settings menu.",
            citations: [{ subjectType: "HIGHLIGHT", subjectId: "h1" }],
          },
        },
      ],
    });

    const result = await answerResearchQuestion("What confused users?", [], candidates);
    expect(result).toEqual({
      answer: "Users struggled with the settings menu.",
      citations: [{ subjectType: "HIGHLIGHT", subjectId: "h1" }],
    });
  });

  it("drops citations that don't match any candidate", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          input: {
            answer: "Some answer.",
            citations: [
              { subjectType: "HIGHLIGHT", subjectId: "h1" },
              { subjectType: "INSIGHT", subjectId: "invented-id" },
            ],
          },
        },
      ],
    });

    const result = await answerResearchQuestion("Q", [], candidates);
    expect(result?.citations).toEqual([{ subjectType: "HIGHLIGHT", subjectId: "h1" }]);
  });

  it("defaults to an empty citations array when the model omits it", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", input: { answer: "I don't have enough information." } }],
    });

    const result = await answerResearchQuestion("Q", [], candidates);
    expect(result).toEqual({ answer: "I don't have enough information.", citations: [] });
  });

  it("returns null when the model response fails schema validation", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", input: { citations: "not an array" } }],
    });

    const result = await answerResearchQuestion("Q", [], candidates);
    expect(result).toBeNull();
  });

  it("returns null when there is no tool_use block in the response", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "I refuse to use the tool." }],
    });

    const result = await answerResearchQuestion("Q", [], candidates);
    expect(result).toBeNull();
  });

  it("returns null without calling the API for a blank question", async () => {
    const result = await answerResearchQuestion("   ", [], candidates);
    expect(result).toBeNull();
    expect(createMock).not.toHaveBeenCalled();
  });
});
