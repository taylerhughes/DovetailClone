import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAiEnabled } from "@/lib/ai/client";
import { generateThemes } from "@/lib/ai/themes";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectEditAccess } from "@/lib/auth/authorize";
import { THEME_CLUSTERING_HIGHLIGHT_CAP } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rateLimit/limiter";
import { tooManyRequestsResponse } from "@/lib/rateLimit/response";
import { RATE_LIMITS } from "@/lib/rateLimit/limits";

const bodySchema = z.object({
  projectId: z.string(),
});

export async function POST(request: Request) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI features are disabled" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(`ai:generate-themes:${user.id}`, RATE_LIMITS.aiHeavy);
  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSec);
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { projectId } = parsed.data;

  if (!(await hasProjectEditAccess(projectId, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const totalHighlightCount = await db.highlight.count({
    where: { note: { projectId } },
  });

  const highlights = await db.highlight.findMany({
    where: { note: { projectId } },
    include: { tagAssignments: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
    take: THEME_CLUSTERING_HIGHLIGHT_CAP,
  });

  try {
    const themes = await generateThemes(
      highlights.map((h) => ({
        id: h.id,
        quote: h.quote,
        tags: h.tagAssignments.map((t) => t.tag.name),
      })),
    );

    if (themes.length === 0) {
      return NextResponse.json(
        { error: "AI could not generate any themes from this project's highlights" },
        { status: 502 },
      );
    }

    // Only replace the existing theme set once we have a new one to put in its
    // place -- an empty `themes` result (malformed AI response, or every
    // theme filtered out for having no valid highlights) must never wipe a
    // project's prior themes with nothing to show for it.
    await db.$transaction([
      db.theme.deleteMany({ where: { projectId } }),
      ...themes.map((theme) =>
        db.theme.create({
          data: {
            projectId,
            title: theme.title,
            description: theme.description,
            highlightLinks: {
              create: theme.highlightIds.map((highlightId) => ({ highlightId })),
            },
          },
        }),
      ),
    ]);

    return NextResponse.json({
      themeCount: themes.length,
      shownHighlightCount: highlights.length,
      totalHighlightCount,
    });
  } catch (err) {
    console.error("generate-themes failed", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
