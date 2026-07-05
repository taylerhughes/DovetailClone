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
import { NoteCard } from "@/components/cards/NoteCard";
import { setNoteFieldValue } from "@/actions/fieldValues";
import type { FieldType } from "@/lib/generated/prisma/client";
import type { GroupColumn } from "@/lib/views/sortGroup";

type BoardNote = { id: string; title: string; plainText: string };

const UNCATEGORIZED = "__uncategorized__";

export function BoardView({
  projectId,
  columns,
  groupByFieldId,
  groupByFieldType,
}: {
  projectId: string;
  columns: GroupColumn<BoardNote>[];
  groupByFieldId: string;
  groupByFieldType: FieldType;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const noteId = event.active.id as string;
    const columnKey = event.over?.id as string | undefined;
    if (!columnKey) return;

    startTransition(async () => {
      if (groupByFieldType === "PERSON") {
        await setNoteFieldValue(noteId, groupByFieldId, {
          kind: "PERSON",
          teamMemberId: columnKey === UNCATEGORIZED ? null : columnKey,
        });
      } else if (groupByFieldType === "SINGLE_SELECT") {
        await setNoteFieldValue(noteId, groupByFieldId, {
          kind: "SINGLE_SELECT",
          optionId: columnKey === UNCATEGORIZED ? null : columnKey,
        });
      } else if (groupByFieldType === "MULTI_SELECT" && columnKey !== UNCATEGORIZED) {
        await setNoteFieldValue(noteId, groupByFieldId, {
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
          <BoardColumn key={column.key} column={column} projectId={projectId} />
        ))}
      </div>
    </DndContext>
  );
}

function BoardColumn({
  column,
  projectId,
}: {
  column: GroupColumn<BoardNote>;
  projectId: string;
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
        {column.records.map((note) => (
          <BoardCard key={note.id} note={note} projectId={projectId} />
        ))}
      </div>
    </div>
  );
}

function BoardCard({
  note,
  projectId,
}: {
  note: BoardNote;
  projectId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: note.id });

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
      <NoteCard projectId={projectId} note={note} compact />
    </div>
  );
}
