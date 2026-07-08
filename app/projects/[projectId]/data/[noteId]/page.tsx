import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { db } from "@/lib/db";
import { NoteTitle } from "@/components/notes/NoteTitle";
import { NoteActions } from "@/components/notes/NoteActions";
import { Uploader } from "@/components/attachments/Uploader";
import { MediaPlayer } from "@/components/attachments/MediaPlayer";
import { WholeNoteHighlightButton } from "@/components/highlights/WholeNoteHighlightButton";
import { HighlightRow } from "@/components/highlights/HighlightRow";
import { FieldEditorCell } from "@/components/fields/FieldEditorCell";
import { setNoteFieldValue } from "@/actions/fieldValues";
import { NoteEditorSection } from "@/components/editor/NoteEditorSection";
import { isAiEnabled } from "@/lib/ai/client";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { isTranscriptionEnabled } from "@/lib/transcription/client";
import { SpeakerMappingPanel } from "@/components/attachments/SpeakerMappingPanel";
import { extractTranscriptSpeakers } from "@/lib/editor/extractIds";
import { HighlightClipStrip } from "@/components/highlights/HighlightClipStrip";
import { FloatingVideo } from "@/components/playback/FloatingVideo";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; noteId: string }>;
}) {
  const { projectId, noteId } = await params;
  const [note, tags, fields, teamMembers] = await Promise.all([
    db.note.findUnique({
      where: { id: noteId },
      include: {
        attachments: { orderBy: { createdAt: "asc" } },
        highlights: {
          orderBy: { order: "asc" },
          include: { tagAssignments: { select: { tagId: true } } },
        },
        fieldValues: { include: { selectedOptions: true } },
      },
    }),
    db.tag.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
    db.field.findMany({
      where: { projectId, appliesTo: { in: ["NOTE", "BOTH"] } },
      orderBy: { order: "asc" },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    db.teamMember.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
  ]);

  if (!note) {
    notFound();
  }

  const valuesByFieldId = new Map(note.fieldValues.map((v) => [v.fieldId, v]));
  const tagById = new Map(tags.map((t) => [t.id, t]));

  const teamMemberNameById = new Map(teamMembers.map((m) => [m.id, m.name]));
  const speakerMaps = new Map<string, Map<string, string>>();
  for (const attachment of note.attachments) {
    const map = attachment.speakerMap as Record<string, string> | null;
    if (!map) continue;
    const resolved = new Map<string, string>();
    for (const [label, teamMemberId] of Object.entries(map)) {
      const name = teamMemberNameById.get(teamMemberId);
      if (name) resolved.set(label, name);
    }
    speakerMaps.set(attachment.id, resolved);
  }

  // First transcribed video gets the sticky-left-column treatment
  const primaryVideo = note.attachments.find(
    (a) => a.kind === "VIDEO" && a.transcriptionStatus === "DONE",
  ) ?? null;

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

      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-3">
          {fields.map((field) => {
            const fv = valuesByFieldId.get(field.id);
            return (
              <div key={field.id} className="flex flex-col gap-1">
                <Text as="span" size={75} color="subdued">{field.name}</Text>
                <FieldEditorCell
                  type={field.type}
                  options={field.options}
                  teamMembers={teamMembers}
                  onSubmit={setNoteFieldValue.bind(null, note.id, field.id)}
                  value={{
                    valueText: fv?.valueText ?? null,
                    valueNumber: fv?.valueNumber ?? null,
                    valueDate: fv?.valueDate
                      ? fv.valueDate.toISOString().slice(0, 10)
                      : null,
                    teamMemberId: fv?.teamMemberId ?? null,
                    selectedOptionIds:
                      fv?.selectedOptions.map((o) => o.fieldOptionId) ?? [],
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* All attachments — primary video uses the 3-col grid via NoteEditorSection's leftSlot */}
      {note.attachments.map((attachment) => {
        const isPrimary = attachment === primaryVideo;
        const isDone = attachment.transcriptionStatus === "DONE";
        const speakers = isDone
          ? extractTranscriptSpeakers(note.content as JSONContent, attachment.id)
          : [];
        const clipHighlights = note.highlights
          .filter((h) => h.attachmentId === attachment.id && h.clipStartSec != null)
          .map((h) => ({
            id: h.id,
            quote: h.quote,
            clipStartSec: h.clipStartSec as number,
            clipEndSec: h.clipEndSec as number | null,
            tags: h.tagAssignments
              .map((t) => tagById.get(t.tagId))
              .filter((t): t is NonNullable<typeof t> => t != null)
              .map((t) => ({ id: t.id, name: t.name, color: t.color })),
          }));

        if (isPrimary) {
          return (
            <div key={attachment.id} className="flex flex-col gap-2">
              {/* FloatingVideo renders a placeholder + one fixed <video> that never moves in the DOM */}
              <FloatingVideo attachmentId={attachment.id} />
              <HighlightClipStrip attachmentId={attachment.id} highlights={clipHighlights} />
              {speakers.length > 0 && (
                <SpeakerMappingPanel
                  attachmentId={attachment.id}
                  speakers={speakers}
                  speakerMap={(attachment.speakerMap as Record<string, string> | null) ?? {}}
                  teamMembers={teamMembers}
                />
              )}
            </div>
          );
        }

        // Non-primary attachments render full-width above the editor
        return (
          <div key={attachment.id} className="flex flex-col gap-2">
            <MediaPlayer
              attachment={attachment}
              transcriptionEnabled={isTranscriptionEnabled()}
            />
            {attachment.kind === "VIDEO" && (
              <HighlightClipStrip attachmentId={attachment.id} highlights={clipHighlights} />
            )}
            {speakers.length > 0 && (
              <SpeakerMappingPanel
                attachmentId={attachment.id}
                speakers={speakers}
                speakerMap={(attachment.speakerMap as Record<string, string> | null) ?? {}}
                teamMembers={teamMembers}
              />
            )}
          </div>
        );
      })}

      <NoteEditorSection
        noteId={note.id}
        projectId={projectId}
        initialContent={note.content as JSONContent}
        speakerMaps={speakerMaps}
        allTags={tags}
        highlights={note.highlights.map((h) => ({
          id: h.id,
          markId: h.markId,
          tagIds: h.tagAssignments.map((t) => t.tagId),
        }))}
        aiEnabled={isAiEnabled()}
      />

      {note.highlights.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <Heading level={3} size={75} color="subdued">Highlights in this note</Heading>
          <div className="flex flex-col gap-2">
            {note.highlights.map((h) => (
              <HighlightRow
                key={h.id}
                projectId={projectId}
                allTags={tags}
                aiEnabled={isAiEnabled()}
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
