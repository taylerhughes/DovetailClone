import { describe, expect, it, vi, beforeEach } from "vitest";

const embedMock = vi.fn();

vi.mock("./client", () => ({
  getVoyageClient: () => ({ embed: embedMock }),
  EMBEDDING_MODELS: { embed: "test-embed-model" },
}));

import { embedTexts } from "./embed";

beforeEach(() => {
  embedMock.mockReset();
});

describe("embedTexts", () => {
  it("returns [] without calling the API for an empty input", async () => {
    const result = await embedTexts([], "document");
    expect(result).toEqual([]);
    expect(embedMock).not.toHaveBeenCalled();
  });

  it("passes inputType through and returns embeddings in index order", async () => {
    embedMock.mockResolvedValue({
      data: [
        { embedding: [0.2, 0.2], index: 1 },
        { embedding: [0.1, 0.1], index: 0 },
      ],
      model: "test-embed-model",
    });

    const result = await embedTexts(["a", "b"], "query");
    expect(embedMock).toHaveBeenCalledWith({
      input: ["a", "b"],
      model: "test-embed-model",
      inputType: "query",
    });
    expect(result).toEqual([
      [0.1, 0.1],
      [0.2, 0.2],
    ]);
  });

  it("returns [] entries as empty arrays when data is missing", async () => {
    embedMock.mockResolvedValue({ data: [], model: "test-embed-model" });
    const result = await embedTexts(["a"], "document");
    expect(result).toEqual([]);
  });
});
