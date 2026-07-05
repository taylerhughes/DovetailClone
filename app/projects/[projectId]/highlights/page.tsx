import { db } from "@/lib/db";
import { HighlightsList } from "@/components/highlights/HighlightsList";
import { isAiEnabled } from "@/lib/ai/client";

export default async function HighlightsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [highlights, tags] = await Promise.all([
    db.highlight.findMany({
      where: { note: { projectId } },
      orderBy: { createdAt: "desc" },
      include: {
        note: { select: { id: true, title: true } },
        tagAssignments: { select: { tagId: true } },
      },
    }),
    db.tag.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        {highlights.length} {highlights.length === 1 ? "highlight" : "highlights"}
      </h2>

      {highlights.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
          <p className="text-sm font-medium">No highlights yet</p>
          <p className="text-sm text-muted-foreground">
            Select text in a note and click Highlight to capture it here.
          </p>
        </div>
      ) : (
        <HighlightsList
          projectId={projectId}
          allTags={tags}
          aiEnabled={isAiEnabled()}
          highlights={highlights.map((h) => ({
            id: h.id,
            quote: h.quote,
            wholeNote: h.wholeNote,
            orphaned: h.orphaned,
            noteId: h.note.id,
            noteTitle: h.note.title,
            tagIds: h.tagAssignments.map((t) => t.tagId),
          }))}
        />
      )}
    </div>
  );
}
