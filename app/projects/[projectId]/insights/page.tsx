import { db } from "@/lib/db";
import { NewInsightButton } from "@/components/insights/NewInsightButton";
import { ViewSwitcher } from "@/components/views/ViewSwitcher";
import { ViewConfigPanel } from "@/components/views/ViewConfigPanel";
import { GridView } from "@/components/views/GridView";
import { ListView } from "@/components/views/ListView";
import { BoardView } from "@/components/views/BoardView";
import { TableView } from "@/components/views/TableView";
import { CanvasView } from "@/components/views/CanvasView";
import { AddToCanvasPanel } from "@/components/views/canvas/AddToCanvasPanel";
import { getCanvasData } from "@/lib/views/canvasData";
import { buildInsightWhere } from "@/lib/views/queryBuilder";
import { setInsightFieldValue } from "@/actions/insightFieldValues";
import { sortByField, groupByField } from "@/lib/views/sortGroup";
import { CapNotice } from "@/components/ui/CapNotice";
import { LIST_RESULT_CAP } from "@/lib/constants";
import type { FilterRule, SortDirection } from "@/lib/views/types";
import type { FieldType } from "@/lib/generated/prisma/client";

export default async function InsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { projectId } = await params;
  const { view: viewIdParam } = await searchParams;

  const [views, fields, teamMembers] = await Promise.all([
    db.view.findMany({
      where: { projectId, entityType: "INSIGHT" },
      orderBy: { order: "asc" },
    }),
    db.field.findMany({
      where: { projectId, appliesTo: { in: ["INSIGHT", "BOTH"] } },
      orderBy: { order: "asc" },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    db.teamMember.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
  ]);

  const activeView = views.find((v) => v.id === viewIdParam) ?? views[0] ?? null;
  const layout = activeView?.layout ?? "GRID";
  const filterConfig = ((activeView?.filterConfig as unknown as FilterRule[]) ?? []);

  const fieldTypesById = new Map(fields.map((f) => [f.id, f.type]));
  const where = buildInsightWhere(projectId, filterConfig, fieldTypesById);

  const [insightsResult, totalInsights] = await Promise.all([
    db.insight.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: LIST_RESULT_CAP,
      include: { fieldValues: { include: { selectedOptions: true } } },
    }),
    db.insight.count({ where }),
  ]);
  let insights = insightsResult;

  if (activeView?.sortFieldId) {
    const sortFieldType = fieldTypesById.get(activeView.sortFieldId);
    if (sortFieldType) {
      insights = sortByField(
        insights,
        activeView.sortFieldId,
        sortFieldType,
        (activeView.sortDirection as SortDirection) ?? "asc",
      );
    }
  }

  const basePath = `/projects/${projectId}/insights`;
  const notes = insights.map((i) => ({ id: i.id, title: i.title, plainText: i.plainText }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <ViewSwitcher
          basePath={basePath}
          projectId={projectId}
          entityType="INSIGHT"
          views={views}
          activeViewId={activeView?.id ?? null}
          availableLayouts={["GRID", "LIST", "BOARD", "TABLE", "CANVAS"]}
        />
        <div className="flex items-center gap-2">
          {activeView && layout !== "CANVAS" && (
            <ViewConfigPanel
              viewId={activeView.id}
              layout={layout}
              fields={fields}
              fieldOptionsById={new Map(fields.map((f) => [f.id, f.options]))}
              teamMembers={teamMembers}
              groupByFieldId={activeView.groupByFieldId}
              sortFieldId={activeView.sortFieldId}
              sortDirection={activeView.sortDirection as SortDirection | null}
              filterConfig={filterConfig}
            />
          )}
          <NewInsightButton projectId={projectId} />
        </div>
      </div>

      <CapNotice shown={insights.length} total={totalInsights} />

      {layout === "GRID" && (
        <GridView basePath={basePath} records={notes} emptyLabel="No insights match this view" />
      )}
      {layout === "LIST" && (
        <ListView basePath={basePath} records={notes} emptyLabel="No insights match this view" />
      )}
      {layout === "TABLE" && (
        <TableView
          projectId={projectId}
          detailPathPrefix="insights"
          notes={insights}
          fields={fields}
          teamMembers={teamMembers}
          fieldValueAction={setInsightFieldValue}
        />
      )}
      {layout === "BOARD" &&
        (() => {
          const groupField = fields.find((f) => f.id === activeView?.groupByFieldId);
          if (!groupField || !["SINGLE_SELECT", "MULTI_SELECT", "PERSON"].includes(groupField.type)) {
            return (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
                <p className="text-sm font-medium">Pick a group-by field</p>
                <p className="text-sm text-muted-foreground">
                  Use Configure to choose a select or person field to group by.
                </p>
              </div>
            );
          }
          const columns = groupByField(
            insights,
            groupField.id,
            groupField.type as Extract<FieldType, "SINGLE_SELECT" | "MULTI_SELECT" | "PERSON">,
            groupField.options,
            teamMembers,
          );
          return (
            <BoardView
              basePath={basePath}
              columns={columns.map((c) => ({
                ...c,
                records: c.records.map((r) => ({ id: r.id, title: r.title, plainText: r.plainText })),
              }))}
              groupByFieldId={groupField.id}
              groupByFieldType={groupField.type}
              fieldValueAction={setInsightFieldValue}
            />
          );
        })()}
      {layout === "CANVAS" && activeView && (
        <CanvasSection projectId={projectId} viewId={activeView.id} />
      )}
    </div>
  );
}

async function CanvasSection({
  projectId,
  viewId,
}: {
  projectId: string;
  viewId: string;
}) {
  const { cards, candidates } = await getCanvasData(projectId, viewId);
  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex justify-end">
        <AddToCanvasPanel viewId={viewId} candidates={candidates} />
      </div>
      <CanvasView viewId={viewId} cards={cards} />
    </div>
  );
}
