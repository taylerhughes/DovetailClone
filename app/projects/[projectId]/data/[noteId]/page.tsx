import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { db } from "@/lib/db";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { NoteTitle } from "@/components/notes/NoteTitle";
import { NoteActions } from "@/components/notes/NoteActions";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; noteId: string }>;
}) {
  const { noteId } = await params;
  const note = await db.note.findUnique({ where: { id: noteId } });

  if (!note) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <NoteTitle noteId={note.id} initialTitle={note.title} />
        </div>
        <NoteActions noteId={note.id} />
      </div>
      <NoteEditor
        noteId={note.id}
        initialContent={note.content as JSONContent}
      />
    </div>
  );
}
