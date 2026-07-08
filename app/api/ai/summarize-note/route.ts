import { NextResponse, NextRequest } from "next/server";

// App Runner's ALB has a fixed 120s request timeout. This endpoint can take
// longer than that for long transcripts, so we stream the response — sending
// keep-alive newlines while work is in progress keeps the connection open.
export const maxDuration = 300;
import { z } from "zod";
import { db } from "@/lib/db";
import { isAiEnabled } from "@/lib/ai/client";
import { summarizeNote } from "@/lib/ai/summarize";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectViewAccess } from "@/lib/auth/authorize";
import { checkRateLimit } from "@/lib/rateLimit/limiter";
import { tooManyRequestsResponse } from "@/lib/rateLimit/response";
import { RATE_LIMITS } from "@/lib/rateLimit/limits";
import { updateNoteContent } from "@/actions/notes";
import { applyHighlightMark } from "@/lib/editor/applyHighlightMark";
import { colorForIndex } from "@/lib/palette";
import type { JSONContent } from "@tiptap/react";
import type { Prisma } from "@/lib/generated/prisma/client";

const bodySchema = z.object({
  noteId: z.string(),
});

interface SuggestedTag {
  id: string;
  name: string;
  color: string;
}

interface SuggestedTagAssignment {
  markId: string;
  highlightId: string;
  tags: SuggestedTag[];
}

function buildCitationNode(number: number, markId: string | null): JSONContent {
  return { type: "citation", attrs: { number, markId } };
}

function buildSummaryBlock(
  paragraphs: { text: string; citedHighlightIndices: number[] }[],
  highlightMarkIds: (string | null)[],
): JSONContent[] {
  return [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Summary" }],
    },
    ...paragraphs.map((p) => ({
      type: "paragraph",
      content: [
        ...(p.text ? [{ type: "text", text: p.text }] : []),
        ...p.citedHighlightIndices.map((idx) =>
          buildCitationNode(idx + 1, highlightMarkIds[idx] ?? null),
        ),
      ],
    })),
    { type: "paragraph", content: [] },
  ];
}

export async function POST(request: NextRequest) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI features are disabled" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(`ai:summarize-note:${user.id}`, RATE_LIMITS.aiLight);
  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSec);
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const note = await db.note.findUnique({
    where: { id: parsed.data.noteId },
    select: { plainText: true, content: true, projectId: true },
  });
  if (!note || !(await hasProjectViewAccess(note.projectId, user.id))) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const projectTags = await db.tag.findMany({
    where: { projectId: note.projectId },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });
  const tagNameToTag = new Map(projectTags.map((t) => [t.name.toLowerCase(), t]));
  const totalTagCountAtStart = projectTags.length;

  // Stream the response so App Runner's 120s ALB timeout doesn't kill long
  // transcript summarisations. We send keep-alive newlines while the AI call
  // and DB writes are in progress, then flush the final JSON result.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const keepAlive = setInterval(() => {
        try { controller.enqueue(encoder.encode(" ")); } catch { /* stream closed */ }
      }, 15_000);

      try {
        const aiResult = await summarizeNote(
          note.plainText,
          projectTags.map((t) => t.name),
        );
        if (!aiResult) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: "AI returned no summary" })));
          controller.close();
          clearInterval(keepAlive);
          return;
        }

    const existingContent = note.content as JSONContent | null;
    let existingChildren: JSONContent[] =
      existingContent?.type === "doc" && Array.isArray(existingContent.content)
        ? existingContent.content
        : [];

    // Apply highlight marks to the note content for each AI-suggested highlight
    const highlightCount = await db.highlight.count({
      where: { noteId: parsed.data.noteId },
    });

    const suggestedTagAssignments: SuggestedTagAssignment[] = [];
    const createdHighlightMarkIds: string[] = [];

    for (let i = 0; i < aiResult.highlights.length; i++) {
      const { quote, suggestedTagNames } = aiResult.highlights[i];
      if (!quote.trim()) continue;

      const markId = crypto.randomUUID();

      // Apply the mark to the document JSON
      const updatedDoc = applyHighlightMark(
        { type: "doc", content: existingChildren },
        quote,
        markId,
      );

      // Only proceed if the mark was actually applied (quote found in doc)
      const updatedChildren = updatedDoc.content ?? [];
      const markApplied = JSON.stringify(updatedChildren) !== JSON.stringify(existingChildren);

      if (!markApplied) continue;

      existingChildren = updatedChildren;
      createdHighlightMarkIds.push(markId);

      // Create the Highlight DB row
      const highlight = await db.highlight.create({
        data: {
          noteId: parsed.data.noteId,
          markId,
          quote,
          order: highlightCount + createdHighlightMarkIds.length,
        },
      });

      // Resolve suggested tags — match existing by name, create new ones if needed.
      // Names already created earlier in this same call are in tagNameToTag already.
      const resolvedTags: SuggestedTag[] = [];
      for (const name of suggestedTagNames) {
        if (!name.trim()) continue;
        const key = name.trim().toLowerCase();
        let tag = tagNameToTag.get(key);
        if (!tag) {
          // Create a new tag, picking a color based on current total count
          const color = colorForIndex(totalTagCountAtStart + tagNameToTag.size - projectTags.length);
          try {
            tag = await db.tag.create({
              data: { projectId: note.projectId, name: name.trim(), color },
              select: { id: true, name: true, color: true },
            });
            tagNameToTag.set(key, tag);
          } catch {
            // Unique constraint race (another request created same tag) — fetch it
            const existing = await db.tag.findUnique({
              where: { projectId_name: { projectId: note.projectId, name: name.trim() } },
              select: { id: true, name: true, color: true },
            });
            if (existing) {
              tagNameToTag.set(key, existing);
              tag = existing;
            }
          }
        }
        if (tag) resolvedTags.push(tag);
      }

      if (resolvedTags.length > 0) {
        suggestedTagAssignments.push({ markId, highlightId: highlight.id, tags: resolvedTags });
      }
    }

        const summaryBlock = buildSummaryBlock(aiResult.paragraphs, createdHighlightMarkIds);
        const newContent: JSONContent = {
          type: "doc",
          content: [...summaryBlock, ...existingChildren],
        };

        await updateNoteContent(
          parsed.data.noteId,
          newContent as unknown as Prisma.InputJsonValue,
        );

        controller.enqueue(encoder.encode(JSON.stringify({ ok: true, suggestedTagAssignments })));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("summarize-note failed", err);
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })));
        controller.close();
      } finally {
        clearInterval(keepAlive);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/json" },
  });
}
