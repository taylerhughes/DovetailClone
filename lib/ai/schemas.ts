import { z } from "zod";

export const suggestTagsResultSchema = z.object({
  tags: z.array(
    z.object({
      tagName: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});
export type SuggestTagsResult = z.infer<typeof suggestTagsResultSchema>;

export const summarizeResultSchema = z.object({
  summary: z.string(),
});
export type SummarizeResult = z.infer<typeof summarizeResultSchema>;

export const draftInsightResultSchema = z.object({
  title: z.string(),
  paragraphs: z.array(
    z.object({
      text: z.string(),
      citedHighlightIds: z.array(z.string()).default([]),
    }),
  ),
});
export type DraftInsightResult = z.infer<typeof draftInsightResultSchema>;
