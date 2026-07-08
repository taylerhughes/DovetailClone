import type { JSONContent } from "@tiptap/react";
import { getAnthropicClient, MODELS } from "./client";
import {
  summarizeNoteSystemPrompt,
  summarizeNoteUserPrompt,
  draftInsightSystemPrompt,
  draftInsightUserPrompt,
} from "./prompts";
import { summarizeWithHighlightsResultSchema, draftInsightResultSchema } from "./schemas";

export interface SummarizeNoteResult {
  paragraphs: { text: string; citedHighlightIndices: number[] }[];
  highlights: { quote: string; suggestedTagNames: string[] }[];
}

const SUMMARIZE_TOOL = {
  name: "submit_summary",
  description: "Submit the note summary with highlights and citations.",
  input_schema: {
    type: "object" as const,
    properties: {
      highlights: {
        type: "array",
        description: "Key verbatim quotes worth highlighting, each with suggested tags.",
        items: {
          type: "object",
          properties: {
            quote: { type: "string", description: "Exact verbatim text from the note." },
            suggestedTagNames: {
              type: "array",
              items: { type: "string" },
              description: "Tag names from the existing project tag list that best apply.",
            },
          },
          required: ["quote", "suggestedTagNames"],
        },
      },
      paragraphs: {
        type: "array",
        description: "Summary paragraphs, each citing relevant highlights by 0-based index.",
        items: {
          type: "object",
          properties: {
            text: { type: "string", description: "One paragraph of the summary." },
            citedHighlightIndices: {
              type: "array",
              items: { type: "number" },
              description: "0-based indices into the highlights array that support this paragraph.",
            },
          },
          required: ["text", "citedHighlightIndices"],
        },
      },
    },
    required: ["highlights", "paragraphs"],
  },
};

export async function summarizeNote(
  text: string,
  existingTagNames: string[],
): Promise<SummarizeNoteResult | null> {
  if (!text.trim()) return null;

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODELS.summarize,
    max_tokens: 1200,
    system: summarizeNoteSystemPrompt(),
    messages: [{ role: "user", content: summarizeNoteUserPrompt(text, existingTagNames) }],
    tools: [SUMMARIZE_TOOL],
    tool_choice: { type: "tool", name: "submit_summary" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return null;

  const parsed = summarizeWithHighlightsResultSchema.safeParse(toolUse.input);
  return parsed.success ? parsed.data : null;
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
