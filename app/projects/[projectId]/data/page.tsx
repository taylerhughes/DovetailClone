import Link from "next/link";
import { db } from "@/lib/db";
import { NewNoteButton } from "@/components/notes/NewNoteButton";

export default async function DataPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const notes = await db.note.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </h2>
        <NewNoteButton projectId={projectId} />
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
          <p className="text-sm font-medium">No notes yet</p>
          <p className="text-sm text-muted-foreground">
            Add a note to start capturing research.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-lg border">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/projects/${projectId}/data/${note.id}`}
              className="flex flex-col gap-1 p-4 hover:bg-muted/50"
            >
              <span className="text-sm font-medium">{note.title}</span>
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {note.plainText || "Empty note"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
