import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set; AI features are disabled.");
  }
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 30_000,
      maxRetries: 1,
    });
  }
  return client;
}

export const MODELS = {
  tagging: process.env.ANTHROPIC_MODEL_TAGGING || "claude-haiku-4-5-20251001",
  summarize: process.env.ANTHROPIC_MODEL_SUMMARIZE || "claude-sonnet-4-6",
};
