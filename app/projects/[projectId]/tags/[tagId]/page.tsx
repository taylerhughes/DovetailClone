import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { TagBadge } from "@/components/tags/TagBadge";
import { HighlightRow } from "@/components/highlights/HighlightRow";
import { HighlightReelPanel } from "@/components/tags/HighlightReelPanel";
import { isAiEnabled } from "@/lib/ai/client";
import { isReelEligibleHighlight } from "@/lib/highlightReelEligibility";

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; tagId: string }>;
}) {
  const { projectId, tagId } = await params;

  const [tag, allTags, highlightTags, reels] = await Promise.all([
    db.tag.findUnique({ where: { id: tagId } }),
    db.tag.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
    db.highlightTag.findMany({
      where: { tagId },
      include: {
        highlight: {
          include: {
            note: { select: { id: true, title: true } },
            tagAssignments: { select: { tagId: true } },
            attachment: { select: { kind: true } },
          },
        },
      },
    }),
    db.highlightReel.findMany({
      where: { tagId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!tag || tag.projectId !== projectId) {
    notFound();
  }

  const highlights = highlightTags.map((ht) => ht.highlight);
  const eligibleCount = highlights.filter((h) =>
    isReelEligibleHighlight({
      attachmentId: h.attachmentId,
      clipStartSec: h.clipStartSec,
      clipEndSec: h.clipEndSec,
      attachmentKind: h.attachment?.kind ?? null,
    }),
  ).length;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/projects/${projectId}/tags`}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Back to tags"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <TagBadge name={tag.name} color={tag.color} />
      </div>

      <div className="rounded-lg border p-3">
        <HighlightReelPanel
          projectId={projectId}
          tagId={tagId}
          tagName={tag.name}
          eligibleCount={eligibleCount}
          reels={reels.map((r) => ({
            id: r.id,
            name: r.name,
            status: r.status,
            errorMessage: r.errorMessage,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Highlights tagged &ldquo;{tag.name}&rdquo;
        </h3>
        {highlights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No highlights tagged yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {highlights.map((h) => (
              <HighlightRow
                key={h.id}
                projectId={projectId}
                allTags={allTags}
                aiEnabled={isAiEnabled()}
                showSourceLink
                highlight={{
                  id: h.id,
                  quote: h.quote,
                  wholeNote: h.wholeNote,
                  orphaned: h.orphaned,
                  noteId: h.noteId,
                  noteTitle: h.note.title,
                  tagIds: h.tagAssignments.map((t) => t.tagId),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
