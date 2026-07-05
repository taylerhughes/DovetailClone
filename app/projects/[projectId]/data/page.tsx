import { db } from "@/lib/db";
import { NewNoteButton } from "@/components/notes/NewNoteButton";
import { ViewSwitcher } from "@/components/views/ViewSwitcher";
import { ViewConfigPanel } from "@/components/views/ViewConfigPanel";
import { GridView } from "@/components/views/GridView";
import { ListView } from "@/components/views/ListView";
import { BoardView } from "@/components/views/BoardView";
import { TableView } from "@/components/views/TableView";
import { buildNoteWhere } from "@/lib/views/queryBuilder";
import { sortByField, groupByField } from "@/lib/views/sortGroup";
import type { FilterRule, SortDirection } from "@/lib/views/types";
import type { FieldType } from "@/lib/generated/prisma/client";

export default async function DataPage({
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
      where: { projectId, entityType: "NOTE" },
      orderBy: { order: "asc" },
    }),
    db.field.findMany({
      where: { projectId, appliesTo: { in: ["NOTE", "BOTH"] } },
      orderBy: { order: "asc" },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    db.teamMember.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
  ]);

  const activeView = views.find((v) => v.id === viewIdParam) ?? views[0] ?? null;
  const layout = activeView?.layout ?? "GRID";
  const filterConfig = ((activeView?.filterConfig as unknown as FilterRule[]) ?? []);

  const fieldTypesById = new Map(fields.map((f) => [f.id, f.type]));
  const where = buildNoteWhere(projectId, filterConfig, fieldTypesById);

  let notes = await db.note.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { fieldValues: { include: { selectedOptions: true } } },
  });

  if (activeView?.sortFieldId) {
    const sortFieldType = fieldTypesById.get(activeView.sortFieldId);
    if (sortFieldType) {
      notes = sortByField(
        notes,
        activeView.sortFieldId,
        sortFieldType,
        (activeView.sortDirection as SortDirection) ?? "asc",
      );
    }
  }

  const basePath = `/projects/${projectId}/data`;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <ViewSwitcher
          basePath={basePath}
          projectId={projectId}
          entityType="NOTE"
          views={views}
          activeViewId={activeView?.id ?? null}
        />
        <div className="flex items-center gap-2">
          {activeView && (
            <ViewConfigPanel
              viewId={activeView.id}
              layout={layout}
              fields={fields}
              fieldOptionsById={
                new Map(fields.map((f) => [f.id, f.options]))
              }
              teamMembers={teamMembers}
              groupByFieldId={activeView.groupByFieldId}
              sortFieldId={activeView.sortFieldId}
              sortDirection={activeView.sortDirection as SortDirection | null}
              filterConfig={filterConfig}
            />
          )}
          <NewNoteButton projectId={projectId} />
        </div>
      </div>

      {layout === "GRID" && <GridView projectId={projectId} notes={notes} />}
      {layout === "LIST" && <ListView projectId={projectId} notes={notes} />}
      {layout === "TABLE" && (
        <TableView
          projectId={projectId}
          notes={notes}
          fields={fields}
          teamMembers={teamMembers}
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
            notes,
            groupField.id,
            groupField.type as Extract<FieldType, "SINGLE_SELECT" | "MULTI_SELECT" | "PERSON">,
            groupField.options,
            teamMembers,
          );
          return (
            <BoardView
              projectId={projectId}
              columns={columns}
              groupByFieldId={groupField.id}
              groupByFieldType={groupField.type}
            />
          );
        })()}
    </div>
  );
}
