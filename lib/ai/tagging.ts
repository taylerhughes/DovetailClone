import { getAnthropicClient, MODELS } from "./client";
import { suggestTagsSystemPrompt, suggestTagsUserPrompt } from "./prompts";
import { suggestTagsResultSchema } from "./schemas";

export interface TagOption {
  id: string;
  name: string;
}

export interface TagSuggestion {
  tagId: string;
  confidence: number;
}

const SUGGEST_TAGS_TOOL = {
  name: "suggest_tags",
  description: "Return the suggested tags for the given text.",
  input_schema: {
    type: "object" as const,
    properties: {
      tags: {
        type: "array",
        items: {
          type: "object",
          properties: {
            tagName: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["tagName", "confidence"],
        },
      },
    },
    required: ["tags"],
  },
};

export async function suggestTags(
  text: string,
  existingTags: TagOption[],
): Promise<TagSuggestion[]> {
  if (existingTags.length === 0 || !text.trim()) return [];

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODELS.tagging,
    max_tokens: 512,
    system: suggestTagsSystemPrompt(),
    messages: [
      {
        role: "user",
        content: suggestTagsUserPrompt(
          text,
          existingTags.map((t) => t.name),
        ),
      },
    ],
    tools: [SUGGEST_TAGS_TOOL],
    tool_choice: { type: "tool", name: "suggest_tags" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return [];

  const parsed = suggestTagsResultSchema.safeParse(toolUse.input);
  if (!parsed.success) return [];

  const byLowerName = new Map(existingTags.map((t) => [t.name.toLowerCase(), t]));

  const suggestions: TagSuggestion[] = [];
  for (const { tagName, confidence } of parsed.data.tags) {
    const match = byLowerName.get(tagName.toLowerCase());
    if (match) {
      suggestions.push({ tagId: match.id, confidence });
    }
  }
  return suggestions;
}
