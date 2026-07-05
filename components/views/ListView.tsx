import Link from "next/link";

export function ListView({
  projectId,
  notes,
}: {
  projectId: string;
  notes: { id: string; title: string; plainText: string }[];
}) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
        <p className="text-sm font-medium">No notes match this view</p>
      </div>
    );
  }

  return (
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
  );
}
