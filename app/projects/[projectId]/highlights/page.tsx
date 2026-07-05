import { db } from "@/lib/db";
import { HighlightsList } from "@/components/highlights/HighlightsList";
import { HighlightsTableView } from "@/components/highlights/HighlightsTableView";
import { HighlightsBoardView } from "@/components/highlights/HighlightsBoardView";
import { ViewSwitcher } from "@/components/views/ViewSwitcher";
import { groupByTag } from "@/lib/views/sortGroup";
import { isAiEnabled } from "@/lib/ai/client";

export default async function HighlightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { projectId } = await params;
  const { view: viewIdParam } = await searchParams;

  const [views, highlights, tags] = await Promise.all([
    db.view.findMany({
      where: { projectId, entityType: "HIGHLIGHT" },
      orderBy: { order: "asc" },
    }),
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

  const activeView = views.find((v) => v.id === viewIdParam) ?? views[0] ?? null;
  const layout = activeView?.layout ?? "GRID";
  const basePath = `/projects/${projectId}/highlights`;

  const highlightItems = highlights.map((h) => ({
    id: h.id,
    quote: h.quote,
    wholeNote: h.wholeNote,
    orphaned: h.orphaned,
    noteId: h.note.id,
    noteTitle: h.note.title,
    tagIds: h.tagAssignments.map((t) => t.tagId),
    createdAt: h.createdAt,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <ViewSwitcher
          basePath={basePath}
          projectId={projectId}
          entityType="HIGHLIGHT"
          views={views}
          activeViewId={activeView?.id ?? null}
          availableLayouts={["GRID", "LIST", "BOARD", "TABLE"]}
        />
        <span className="shrink-0 text-sm text-muted-foreground">
          {highlights.length} {highlights.length === 1 ? "highlight" : "highlights"}
        </span>
      </div>

      {highlights.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
          <p className="text-sm font-medium">No highlights yet</p>
          <p className="text-sm text-muted-foreground">
            Select text in a note and click Highlight to capture it here.
          </p>
        </div>
      ) : (
        <>
          {(layout === "GRID" || layout === "LIST") && (
            <HighlightsList
              projectId={projectId}
              allTags={tags}
              aiEnabled={isAiEnabled()}
              layout={layout === "GRID" ? "grid" : "list"}
              highlights={highlightItems}
            />
          )}
          {layout === "TABLE" && (
            <HighlightsTableView
              projectId={projectId}
              allTags={tags}
              highlights={highlightItems}
            />
          )}
          {layout === "BOARD" && (
            <HighlightsBoardView columns={groupByTag(highlightItems, tags)} />
          )}
        </>
      )}
    </div>
  );
}
