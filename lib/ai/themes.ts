import { getAnthropicClient, MODELS } from "./client";
import { generateThemesSystemPrompt, generateThemesUserPrompt } from "./prompts";
import { generateThemesResultSchema } from "./schemas";

const GENERATE_THEMES_TOOL = {
  name: "submit_themes",
  description: "Submit the generated themes.",
  input_schema: {
    type: "object" as const,
    properties: {
      themes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            highlightIds: { type: "array", items: { type: "string" } },
          },
          required: ["title", "description"],
        },
      },
    },
    required: ["themes"],
  },
};

export interface HighlightForClustering {
  id: string;
  quote: string;
  tags: string[];
}

export interface GeneratedTheme {
  title: string;
  description: string;
  highlightIds: string[];
}

const MAX_THEMES = 20;

export async function generateThemes(
  highlights: HighlightForClustering[],
): Promise<GeneratedTheme[]> {
  if (highlights.length === 0) return [];

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODELS.summarize,
    max_tokens: 1500,
    system: generateThemesSystemPrompt(),
    messages: [{ role: "user", content: generateThemesUserPrompt(highlights) }],
    tools: [GENERATE_THEMES_TOOL],
    tool_choice: { type: "tool", name: "submit_themes" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return [];

  const parsed = generateThemesResultSchema.safeParse(toolUse.input);
  if (!parsed.success) return [];

  const validHighlightIds = new Set(highlights.map((h) => h.id));

  return parsed.data.themes
    .map((theme) => ({
      title: theme.title,
      description: theme.description,
      highlightIds: theme.highlightIds.filter((id) => validHighlightIds.has(id)),
    }))
    .filter((theme) => theme.highlightIds.length > 0)
    .slice(0, MAX_THEMES);
}
