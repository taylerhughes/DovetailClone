import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAiEnabled } from "@/lib/ai/client";
import { isEmbeddingsEnabled } from "@/lib/embeddings/client";
import { embedTexts } from "@/lib/embeddings/embed";
import { similaritySearch } from "@/lib/embeddings/store";
import { detectConflicts } from "@/lib/ai/conflicts";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectEditAccess } from "@/lib/auth/authorize";
import { checkRateLimit } from "@/lib/rateLimit/limiter";
import { tooManyRequestsResponse } from "@/lib/rateLimit/response";
import { RATE_LIMITS } from "@/lib/rateLimit/limits";

const K = 15;

const bodySchema = z.object({
  insightId: z.string(),
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

  const rateLimit = await checkRateLimit(`ai:check-conflicts:${user.id}`, RATE_LIMITS.aiHeavy);
  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSec);
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { insightId } = parsed.data;

  const insight = await db.insight.findUnique({
    where: { id: insightId },
    select: {
      id: true,
      projectId: true,
      title: true,
      plainText: true,
      highlightLinks: { select: { highlightId: true } },
    },
  });
  if (!insight || !(await hasProjectEditAccess(insight.projectId, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const [queryEmbedding] = await embedTexts([insight.plainText || insight.title], "query");
    const results = await similaritySearch({
      queryEmbedding,
      accessibleProjectIds: [insight.projectId],
      k: K,
      subjectTypes: ["HIGHLIGHT", "INSIGHT"],
      excludeSubjectIds: [
        { subjectType: "INSIGHT", subjectId: insight.id },
        ...insight.highlightLinks.map((l) => ({
          subjectType: "HIGHLIGHT" as const,
          subjectId: l.highlightId,
        })),
      ],
    });

    const candidates = results
      .filter((r): r is typeof r & { subjectType: "HIGHLIGHT" | "INSIGHT" } =>
        r.subjectType === "HIGHLIGHT" || r.subjectType === "INSIGHT",
      )
      .map((r) => ({
        subjectType: r.subjectType,
        subjectId: r.subjectId,
        text: r.chunkText,
      }));

    const conflicts = await detectConflicts(insight.title, insight.plainText, candidates);

    const existing = await db.insightConflict.findMany({
      where: { insightId: insight.id },
      select: { id: true, conflictingType: true, conflictingId: true, dismissed: true },
    });
    const existingByKey = new Map(
      existing.map((e) => [`${e.conflictingType}:${e.conflictingId}`, e]),
    );
    const foundKeys = new Set(conflicts.map((c) => `${c.subjectType}:${c.subjectId}`));

    // Leave dismissed rows' dismissal alone -- never resurrect a dismissed
    // conflict just because it recurred -- so only non-dismissed matches get
    // an upsert.
    const upsertOps = conflicts
      .filter((c) => !existingByKey.get(`${c.subjectType}:${c.subjectId}`)?.dismissed)
      .map((c) =>
        db.insightConflict.upsert({
          where: {
            insightId_conflictingType_conflictingId: {
              insightId: insight.id,
              conflictingType: c.subjectType,
              conflictingId: c.subjectId,
            },
          },
          create: {
            insightId: insight.id,
            conflictingType: c.subjectType,
            conflictingId: c.subjectId,
            severity: c.severity,
            explanation: c.explanation,
          },
          update: { severity: c.severity, explanation: c.explanation },
        }),
      );

    await db.$transaction([
      ...upsertOps,
      // Stale-conflict cleanup: delete non-dismissed rows that no longer
      // recur, leaving dismissed rows untouched regardless.
      db.insightConflict.deleteMany({
        where: {
          insightId: insight.id,
          dismissed: false,
          id: {
            in: existing
              .filter(
                (e) => !e.dismissed && !foundKeys.has(`${e.conflictingType}:${e.conflictingId}`),
              )
              .map((e) => e.id),
          },
        },
      }),
    ]);

    return NextResponse.json({ conflictCount: conflicts.length });
  } catch (err) {
    console.error("check-conflicts failed", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
