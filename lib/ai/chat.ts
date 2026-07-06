import { getAnthropicClient, MODELS } from "./client";
import {
  askResearchSystemPrompt,
  askResearchUserPrompt,
  type AskResearchCandidate,
} from "./prompts";
import { askResearchResultSchema } from "./schemas";

const ASK_RESEARCH_TOOL = {
  name: "submit_answer",
  description: "Submit the answer to the research question, with citations.",
  input_schema: {
    type: "object" as const,
    properties: {
      answer: { type: "string" },
      citations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            subjectType: { type: "string", enum: ["NOTE", "HIGHLIGHT", "INSIGHT"] },
            subjectId: { type: "string" },
          },
          required: ["subjectType", "subjectId"],
        },
      },
    },
    required: ["answer"],
  },
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskResearchCitation {
  subjectType: "NOTE" | "HIGHLIGHT" | "INSIGHT";
  subjectId: string;
}

export interface AskResearchAnswer {
  answer: string;
  citations: AskResearchCitation[];
}

export async function answerResearchQuestion(
  question: string,
  history: ChatMessage[],
  candidates: AskResearchCandidate[],
): Promise<AskResearchAnswer | null> {
  if (!question.trim()) return null;

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODELS.summarize,
    max_tokens: 1000,
    system: askResearchSystemPrompt(),
    messages: [{ role: "user", content: askResearchUserPrompt(question, history, candidates) }],
    tools: [ASK_RESEARCH_TOOL],
    tool_choice: { type: "tool", name: "submit_answer" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return null;

  const parsed = askResearchResultSchema.safeParse(toolUse.input);
  if (!parsed.success) return null;

  const validCandidates = new Set(
    candidates.map((c) => `${c.subjectType}:${c.subjectId}`),
  );

  return {
    answer: parsed.data.answer,
    citations: parsed.data.citations.filter((c) =>
      validCandidates.has(`${c.subjectType}:${c.subjectId}`),
    ),
  };
}
