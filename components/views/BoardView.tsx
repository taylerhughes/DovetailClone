"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import { EntityCard } from "@/components/cards/EntityCard";
import type { FieldType } from "@/lib/generated/prisma/client";
import type { FieldValueInput } from "@/lib/fieldValueTypes";
import type { GroupColumn } from "@/lib/views/sortGroup";

type BoardRecord = { id: string; title: string; plainText: string };

const UNCATEGORIZED = "__uncategorized__";

export function BoardView({
  basePath,
  columns,
  groupByFieldId,
  groupByFieldType,
  fieldValueAction,
}: {
  basePath: string;
  columns: GroupColumn<BoardRecord>[];
  groupByFieldId: string;
  groupByFieldType: FieldType;
  fieldValueAction: (
    entityId: string,
    fieldId: string,
    input: FieldValueInput,
  ) => Promise<void>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const recordId = event.active.id as string;
    const columnKey = event.over?.id as string | undefined;
    if (!columnKey) return;

    startTransition(async () => {
      if (groupByFieldType === "PERSON") {
        await fieldValueAction(recordId, groupByFieldId, {
          kind: "PERSON",
          teamMemberId: columnKey === UNCATEGORIZED ? null : columnKey,
        });
      } else if (groupByFieldType === "SINGLE_SELECT") {
        await fieldValueAction(recordId, groupByFieldId, {
          kind: "SINGLE_SELECT",
          optionId: columnKey === UNCATEGORIZED ? null : columnKey,
        });
      } else if (groupByFieldType === "MULTI_SELECT" && columnKey !== UNCATEGORIZED) {
        await fieldValueAction(recordId, groupByFieldId, {
          kind: "MULTI_SELECT",
          optionId: columnKey,
          checked: true,
        });
      }
      router.refresh();
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <BoardColumn key={column.key} column={column} basePath={basePath} />
        ))}
      </div>
    </DndContext>
  );
}

function BoardColumn({
  column,
  basePath,
}: {
  column: GroupColumn<BoardRecord>;
  basePath: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg border p-2 ${isOver ? "bg-muted/50" : ""}`}
    >
      <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
        {column.color && (
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: column.color }}
          />
        )}
        {column.label}
        <span className="ml-auto">{column.records.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {column.records.map((record) => (
          <BoardCard key={record.id} record={record} basePath={basePath} />
        ))}
      </div>
    </div>
  );
}

function BoardCard({
  record,
  basePath,
}: {
  record: BoardRecord;
  basePath: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: record.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <EntityCard
        href={`${basePath}/${record.id}`}
        title={record.title}
        subtitle={record.plainText}
        compact
      />
    </div>
  );
}
