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
import { Card, CardDescription } from "@/components/ui/card";
import { addHighlightTag, removeHighlightTag } from "@/actions/highlights";
import type { GroupColumn } from "@/lib/views/sortGroup";

type BoardHighlight = {
  id: string;
  quote: string;
  noteTitle: string;
  tagIds: string[];
};

const UNCATEGORIZED = "__uncategorized__";

export function HighlightsBoardView({
  columns,
}: {
  columns: GroupColumn<BoardHighlight>[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const highlightId = event.active.id as string;
    const columnKey = event.over?.id as string | undefined;
    if (!columnKey) return;

    const highlight = columns.flatMap((c) => c.records).find((h) => h.id === highlightId);
    if (!highlight) return;

    startTransition(async () => {
      if (columnKey === UNCATEGORIZED) {
        await Promise.all(
          highlight.tagIds.map((tagId) => removeHighlightTag(highlightId, tagId)),
        );
      } else if (!highlight.tagIds.includes(columnKey)) {
        await addHighlightTag(highlightId, columnKey);
      }
      router.refresh();
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <BoardColumn key={column.key} column={column} />
        ))}
      </div>
    </DndContext>
  );
}

function BoardColumn({ column }: { column: GroupColumn<BoardHighlight> }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg border p-2 ${isOver ? "bg-muted/50" : ""}`}
    >
      <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
        {column.color && (
          <span className="size-2 rounded-full" style={{ backgroundColor: column.color }} />
        )}
        {column.label}
        <span className="ml-auto">{column.records.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {column.records.map((highlight) => (
          <BoardCard key={highlight.id} highlight={highlight} />
        ))}
      </div>
    </div>
  );
}

function BoardCard({ highlight }: { highlight: BoardHighlight }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: highlight.id,
  });

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
      <Card className="p-3">
        <p className="line-clamp-3 text-sm italic">&ldquo;{highlight.quote || "(empty)"}&rdquo;</p>
        <CardDescription className="mt-1 text-xs">
          From: {highlight.noteTitle}
        </CardDescription>
      </Card>
    </div>
  );
}
