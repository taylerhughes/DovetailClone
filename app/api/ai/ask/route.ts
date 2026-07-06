import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAiEnabled } from "@/lib/ai/client";
import { isEmbeddingsEnabled } from "@/lib/embeddings/client";
import { embedTexts } from "@/lib/embeddings/embed";
import { similaritySearch } from "@/lib/embeddings/store";
import { getAccessibleProjectIds } from "@/lib/embeddings/accessScope";
import { answerResearchQuestion } from "@/lib/ai/chat";
import { getCurrentUser } from "@/lib/auth/session";

const K = 12;

const bodySchema = z.object({
  question: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(12)
    .default([]),
});

export async function POST(request: Request) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI features are disabled" }, { status: 503 });
  }
  if (!isEmbeddingsEnabled()) {
    return NextResponse.json({ error: "Semantic search is not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { question, history } = parsed.data;

  try {
    const accessibleProjectIds = await getAccessibleProjectIds(user.id);
    if (accessibleProjectIds.length === 0) {
      return NextResponse.json({
        answer: "You don't have access to any projects yet, so there's nothing to search.",
        citations: [],
      });
    }

    const [queryEmbedding] = await embedTexts([question], "query");
    const results = await similaritySearch({
      queryEmbedding,
      accessibleProjectIds,
      k: K,
    });

    const candidates = results.map((r) => ({
      subjectType: r.subjectType,
      subjectId: r.subjectId,
      text: r.chunkText,
    }));

    const answer = await answerResearchQuestion(question, history, candidates);
    if (!answer) {
      return NextResponse.json({ error: "AI could not answer the question" }, { status: 502 });
    }

    const citations = await enrichCitations(answer.citations);

    return NextResponse.json({ answer: answer.answer, citations });
  } catch (err) {
    console.error("ask-research failed", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}

async function enrichCitations(
  citations: { subjectType: "NOTE" | "HIGHLIGHT" | "INSIGHT"; subjectId: string }[],
) {
  const noteIds = citations.filter((c) => c.subjectType === "NOTE").map((c) => c.subjectId);
  const highlightIds = citations
    .filter((c) => c.subjectType === "HIGHLIGHT")
    .map((c) => c.subjectId);
  const insightIds = citations
    .filter((c) => c.subjectType === "INSIGHT")
    .map((c) => c.subjectId);

  const [notes, highlights, insights] = await Promise.all([
    noteIds.length
      ? db.note.findMany({
          where: { id: { in: noteIds } },
          select: { id: true, title: true, projectId: true },
        })
      : [],
    highlightIds.length
      ? db.highlight.findMany({
          where: { id: { in: highlightIds } },
          select: {
            id: true,
            quote: true,
            note: { select: { id: true, title: true, projectId: true } },
          },
        })
      : [],
    insightIds.length
      ? db.insight.findMany({
          where: { id: { in: insightIds } },
          select: { id: true, title: true, projectId: true },
        })
      : [],
  ]);

  const noteById = new Map(notes.map((n) => [n.id, n]));
  const highlightById = new Map(highlights.map((h) => [h.id, h]));
  const insightById = new Map(insights.map((i) => [i.id, i]));

  return citations
    .map((c) => {
      if (c.subjectType === "NOTE") {
        const note = noteById.get(c.subjectId);
        if (!note) return null;
        return {
          subjectType: "NOTE" as const,
          subjectId: c.subjectId,
          sourceTitle: note.title,
          href: `/projects/${note.projectId}/data/${note.id}`,
        };
      }
      if (c.subjectType === "HIGHLIGHT") {
        const highlight = highlightById.get(c.subjectId);
        if (!highlight) return null;
        return {
          subjectType: "HIGHLIGHT" as const,
          subjectId: c.subjectId,
          sourceTitle: `"${highlight.quote}"`,
          href: `/projects/${highlight.note.projectId}/data/${highlight.note.id}`,
        };
      }
      const insight = insightById.get(c.subjectId);
      if (!insight) return null;
      return {
        subjectType: "INSIGHT" as const,
        subjectId: c.subjectId,
        sourceTitle: insight.title,
        href: `/projects/${insight.projectId}/insights/${insight.id}`,
      };
    })
    .filter((c) => c != null);
}
