import { db } from "@/lib/db";
import { Text } from "@/components/ui/text";
import { HighlightsList } from "@/components/highlights/HighlightsList";
import { HighlightsTableView } from "@/components/highlights/HighlightsTableView";
import { HighlightsBoardView } from "@/components/highlights/HighlightsBoardView";
import { ViewSwitcher } from "@/components/views/ViewSwitcher";
import { groupByTag } from "@/lib/views/sortGroup";
import { isAiEnabled } from "@/lib/ai/client";
import { CapNotice } from "@/components/ui/CapNotice";
import { LIST_RESULT_CAP } from "@/lib/constants";

export default async function HighlightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { projectId } = await params;
  const { view: viewIdParam } = await searchParams;

  const [views, highlights, tags, totalHighlights] = await Promise.all([
    db.view.findMany({
      where: { projectId, entityType: "HIGHLIGHT" },
      orderBy: { order: "asc" },
    }),
    db.highlight.findMany({
      where: { note: { projectId } },
      orderBy: { createdAt: "desc" },
      take: LIST_RESULT_CAP,
      include: {
        note: { select: { id: true, title: true } },
        tagAssignments: { select: { tagId: true } },
      },
    }),
    db.tag.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
    db.highlight.count({ where: { note: { projectId } } }),
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
        <Text as="span" size={100} color="subdued" className="shrink-0">
          {totalHighlights} {totalHighlights === 1 ? "tag" : "tags"}
        </Text>
      </div>

      <CapNotice shown={highlights.length} total={totalHighlights} />

      {highlights.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
          <Text size={100} weight="medium">No tags yet</Text>
          <Text size={100} color="subdued">Select text in a note and click Tag to capture it here.</Text>
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
