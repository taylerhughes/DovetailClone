import { NoteCard } from "@/components/cards/NoteCard";

export function GridView({
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} projectId={projectId} note={note} />
      ))}
    </div>
  );
}
