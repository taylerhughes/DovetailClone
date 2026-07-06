import { getAnthropicClient, MODELS } from "./client";
import {
  detectConflictsSystemPrompt,
  detectConflictsUserPrompt,
  type ConflictCandidate,
} from "./prompts";
import { detectConflictsResultSchema } from "./schemas";

const DETECT_CONFLICTS_TOOL = {
  name: "submit_conflicts",
  description: "Submit any conflicts found between the insight and the candidate evidence.",
  input_schema: {
    type: "object" as const,
    properties: {
      conflicts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            subjectType: { type: "string", enum: ["HIGHLIGHT", "INSIGHT"] },
            subjectId: { type: "string" },
            severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            explanation: { type: "string" },
          },
          required: ["subjectType", "subjectId", "severity", "explanation"],
        },
      },
    },
    required: ["conflicts"],
  },
};

export interface DetectedConflict {
  subjectType: "HIGHLIGHT" | "INSIGHT";
  subjectId: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  explanation: string;
}

export async function detectConflicts(
  insightTitle: string,
  insightText: string,
  candidates: ConflictCandidate[],
): Promise<DetectedConflict[]> {
  if (candidates.length === 0) return [];

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODELS.summarize,
    max_tokens: 1200,
    system: detectConflictsSystemPrompt(),
    messages: [
      { role: "user", content: detectConflictsUserPrompt(insightTitle, insightText, candidates) },
    ],
    tools: [DETECT_CONFLICTS_TOOL],
    tool_choice: { type: "tool", name: "submit_conflicts" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return [];

  const parsed = detectConflictsResultSchema.safeParse(toolUse.input);
  if (!parsed.success) return [];

  const validCandidates = new Set(
    candidates.map((c) => `${c.subjectType}:${c.subjectId}`),
  );

  return parsed.data.conflicts.filter((c) =>
    validCandidates.has(`${c.subjectType}:${c.subjectId}`),
  );
}
