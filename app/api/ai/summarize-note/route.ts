import { NextResponse, NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

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
import { applyHighlightMark } from "@/lib/editor/applyHighlightMark";
import { colorForIndex } from "@/lib/palette";
import { docToPlainText } from "@/lib/editor/plainText";
import { syncHighlightsForNote } from "@/lib/highlights/sync";
import { syncNoteEmbeddings, syncHighlightEmbeddings } from "@/lib/embeddings/sync";
import type { JSONContent } from "@tiptap/react";

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
        console.log("[summarize] starting AI call, noteId=", parsed.data.noteId, "plainText.length=", note.plainText?.length ?? 0);
        const aiResult = await summarizeNote(
          note.plainText,
          projectTags.map((t) => t.name),
        );
        console.log("[summarize] AI done, aiResult=", aiResult ? `${aiResult.highlights.length} highlights, ${aiResult.paragraphs.length} paragraphs` : "null");
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

        const highlightCount = await db.highlight.count({
          where: { noteId: parsed.data.noteId },
        });
        console.log("[summarize] existing highlightCount=", highlightCount);

        const suggestedTagAssignments: SuggestedTagAssignment[] = [];
        const createdHighlightMarkIds: string[] = [];

        for (let i = 0; i < aiResult.highlights.length; i++) {
          const { quote, suggestedTagNames } = aiResult.highlights[i];
          if (!quote.trim()) continue;

          const markId = crypto.randomUUID();
          const updatedDoc = applyHighlightMark(
            { type: "doc", content: existingChildren },
            quote,
            markId,
          );

          const updatedChildren = updatedDoc.content ?? [];
          const markApplied = JSON.stringify(updatedChildren) !== JSON.stringify(existingChildren);
          console.log(`[summarize] highlight[${i}] markApplied=`, markApplied, "quote=", quote.slice(0, 60));

          if (!markApplied) continue;

          existingChildren = updatedChildren;
          createdHighlightMarkIds.push(markId);

          const highlight = await db.highlight.create({
            data: {
              noteId: parsed.data.noteId,
              markId,
              quote,
              order: highlightCount + createdHighlightMarkIds.length,
            },
          });

          const resolvedTags: SuggestedTag[] = [];
          for (const name of suggestedTagNames) {
            if (!name.trim()) continue;
            const key = name.trim().toLowerCase();
            let tag = tagNameToTag.get(key);
            if (!tag) {
              const color = colorForIndex(totalTagCountAtStart + tagNameToTag.size - projectTags.length);
              try {
                tag = await db.tag.create({
                  data: { projectId: note.projectId, name: name.trim(), color },
                  select: { id: true, name: true, color: true },
                });
                tagNameToTag.set(key, tag);
              } catch {
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

        console.log("[summarize] createdHighlightMarkIds.length=", createdHighlightMarkIds.length, "building summary block");
        const summaryBlock = buildSummaryBlock(aiResult.paragraphs, createdHighlightMarkIds);
        const newContent: JSONContent = {
          type: "doc",
          content: [...summaryBlock, ...existingChildren],
        };

        console.log("[summarize] updating note in DB");
        const plainText = docToPlainText(newContent as never);
        const updatedNote = await db.note.update({
          where: { id: parsed.data.noteId },
          data: { content: newContent, plainText },
          select: { projectId: true },
        });
        console.log("[summarize] note updated, projectId=", updatedNote.projectId);
        const touchedHighlightIds = await syncHighlightsForNote(
          parsed.data.noteId,
          newContent,
        );
        void syncNoteEmbeddings(parsed.data.noteId);
        void syncHighlightEmbeddings(touchedHighlightIds);
        revalidatePath(`/projects/${updatedNote.projectId}/data`);

        const responseBody = { ok: true, suggestedTagAssignments };
        console.log("[summarize] done, sending response=", JSON.stringify(responseBody).slice(0, 200));
        controller.enqueue(encoder.encode(JSON.stringify(responseBody)));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        console.error("[summarize] FAILED:", msg, stack);
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
