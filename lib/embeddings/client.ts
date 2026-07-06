import { VoyageAIClient } from "voyageai";

let client: VoyageAIClient | null = null;

export function isEmbeddingsEnabled(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY);
}

export function getVoyageClient(): VoyageAIClient {
  if (!process.env.VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY is not set; semantic search is disabled.");
  }
  if (!client) {
    client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
  }
  return client;
}

export const EMBEDDING_MODELS = {
  embed: process.env.VOYAGE_MODEL_EMBED || "voyage-4-lite",
};

export const EMBEDDING_DIMENSIONS = 1024;
