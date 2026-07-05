import type { JSONContent } from "@tiptap/react";
import { getAnthropicClient, MODELS } from "./client";
import {
  summarizeNoteSystemPrompt,
  summarizeNoteUserPrompt,
  draftInsightSystemPrompt,
  draftInsightUserPrompt,
} from "./prompts";
import { summarizeResultSchema, draftInsightResultSchema } from "./schemas";

const SUMMARIZE_TOOL = {
  name: "submit_summary",
  description: "Submit the note summary.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: { type: "string" },
    },
    required: ["summary"],
  },
};

export async function summarizeNote(text: string): Promise<string | null> {
  if (!text.trim()) return null;

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODELS.summarize,
    max_tokens: 300,
    system: summarizeNoteSystemPrompt(),
    messages: [{ role: "user", content: summarizeNoteUserPrompt(text) }],
    tools: [SUMMARIZE_TOOL],
    tool_choice: { type: "tool", name: "submit_summary" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return null;

  const parsed = summarizeResultSchema.safeParse(toolUse.input);
  return parsed.success ? parsed.data.summary : null;
}

const DRAFT_INSIGHT_TOOL = {
  name: "submit_insight_draft",
  description: "Submit the drafted insight title and paragraphs.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" },
      paragraphs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            citedHighlightIds: { type: "array", items: { type: "string" } },
          },
          required: ["text"],
        },
      },
    },
    required: ["title", "paragraphs"],
  },
};

export interface HighlightForDraft {
  id: string;
  quote: string;
  tags: string[];
}

export async function draftInsightFromHighlights(
  highlights: HighlightForDraft[],
): Promise<{ title: string; contentJson: JSONContent } | null> {
  if (highlights.length === 0) return null;

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODELS.summarize,
    max_tokens: 800,
    system: draftInsightSystemPrompt(),
    messages: [{ role: "user", content: draftInsightUserPrompt(highlights) }],
    tools: [DRAFT_INSIGHT_TOOL],
    tool_choice: { type: "tool", name: "submit_insight_draft" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return null;

  const parsed = draftInsightResultSchema.safeParse(toolUse.input);
  if (!parsed.success) return null;

  const validHighlightIds = new Set(highlights.map((h) => h.id));
  const content: JSONContent[] = [];

  for (const paragraph of parsed.data.paragraphs) {
    content.push({
      type: "paragraph",
      content: paragraph.text ? [{ type: "text", text: paragraph.text }] : [],
    });
    for (const highlightId of paragraph.citedHighlightIds) {
      if (validHighlightIds.has(highlightId)) {
        content.push({ type: "highlightEmbed", attrs: { highlightId } });
      }
    }
  }

  return {
    title: parsed.data.title,
    contentJson: { type: "doc", content },
  };
}
