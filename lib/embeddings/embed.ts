import { getVoyageClient, EMBEDDING_MODELS } from "./client";

export type EmbeddingInputType = "document" | "query";

/**
 * Embeds a batch of texts via Voyage AI. `inputType` must be "document" for
 * stored content and "query" for a search/chat question -- Voyage prepends
 * different instruction text internally for each, and getting this wrong
 * silently hurts retrieval quality rather than erroring.
 */
export async function embedTexts(
  texts: string[],
  inputType: EmbeddingInputType,
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = getVoyageClient();
  const response = await client.embed({
    input: texts,
    model: EMBEDDING_MODELS.embed,
    inputType,
  });

  const data = response.data ?? [];
  const sorted = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return sorted.map((item) => item.embedding ?? []);
}
