import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAiEnabled } from "@/lib/ai/client";
import { draftInsightFromHighlights } from "@/lib/ai/summarize";
import { docToPlainText } from "@/lib/editor/plainText";
import type { Prisma } from "@/lib/generated/prisma/client";

const bodySchema = z.object({
  projectId: z.string(),
  highlightIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI features are disabled" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { projectId, highlightIds } = parsed.data;

  const highlights = await db.highlight.findMany({
    where: { id: { in: highlightIds } },
    include: { tagAssignments: { include: { tag: true } } },
  });

  try {
    const draft = await draftInsightFromHighlights(
      highlights.map((h) => ({
        id: h.id,
        quote: h.quote,
        tags: h.tagAssignments.map((t) => t.tag.name),
      })),
    );

    if (!draft) {
      return NextResponse.json({ error: "AI could not draft an insight" }, { status: 502 });
    }

    const insight = await db.insight.create({
      data: {
        projectId,
        title: draft.title,
        content: draft.contentJson as unknown as Prisma.InputJsonValue,
        plainText: docToPlainText(draft.contentJson),
      },
    });

    await db.insightHighlight.createMany({
      data: highlightIds.map((highlightId) => ({ insightId: insight.id, highlightId })),
      skipDuplicates: true,
    });

    return NextResponse.json({ insightId: insight.id });
  } catch (err) {
    console.error("draft-insight failed", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
