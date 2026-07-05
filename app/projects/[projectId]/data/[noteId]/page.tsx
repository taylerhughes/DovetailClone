import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { db } from "@/lib/db";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { NoteTitle } from "@/components/notes/NoteTitle";
import { NoteActions } from "@/components/notes/NoteActions";
import { Uploader } from "@/components/attachments/Uploader";
import { MediaPlayer } from "@/components/attachments/MediaPlayer";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; noteId: string }>;
}) {
  const { noteId } = await params;
  const note = await db.note.findUnique({
    where: { id: noteId },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });

  if (!note) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <NoteTitle noteId={note.id} initialTitle={note.title} />
        </div>
        <Uploader noteId={note.id} />
        <NoteActions noteId={note.id} />
      </div>

      {note.attachments.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {note.attachments.map((attachment) => (
            <MediaPlayer key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}

      <NoteEditor
        noteId={note.id}
        initialContent={note.content as JSONContent}
      />
    </div>
  );
}
