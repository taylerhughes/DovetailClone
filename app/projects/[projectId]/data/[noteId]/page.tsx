import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { db } from "@/lib/db";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { NoteTitle } from "@/components/notes/NoteTitle";
import { NoteActions } from "@/components/notes/NoteActions";
import { Uploader } from "@/components/attachments/Uploader";
import { MediaPlayer } from "@/components/attachments/MediaPlayer";
import { WholeNoteHighlightButton } from "@/components/highlights/WholeNoteHighlightButton";
import { HighlightRow } from "@/components/highlights/HighlightRow";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; noteId: string }>;
}) {
  const { projectId, noteId } = await params;
  const [note, tags] = await Promise.all([
    db.note.findUnique({
      where: { id: noteId },
      include: {
        attachments: { orderBy: { createdAt: "asc" } },
        highlights: {
          orderBy: { order: "asc" },
          include: { tagAssignments: { select: { tagId: true } } },
        },
      },
    }),
    db.tag.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
  ]);

  if (!note) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <NoteTitle noteId={note.id} initialTitle={note.title} />
        </div>
        <WholeNoteHighlightButton noteId={note.id} />
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

      {note.highlights.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Highlights in this note
          </h3>
          <div className="flex flex-col gap-2">
            {note.highlights.map((h) => (
              <HighlightRow
                key={h.id}
                projectId={projectId}
                allTags={tags}
                highlight={{
                  id: h.id,
                  quote: h.quote,
                  wholeNote: h.wholeNote,
                  orphaned: h.orphaned,
                  noteId: note.id,
                  tagIds: h.tagAssignments.map((t) => t.tagId),
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
