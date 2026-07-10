import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { db } from "@/lib/db";
import { NotePageShell } from "@/components/notes/NotePageShell";
import { HighlightRow } from "@/components/highlights/HighlightRow";
import { MediaPlayer } from "@/components/attachments/MediaPlayer";
import { NoteFieldsPanel } from "@/components/fields/NoteFieldsPanel";
import { setNoteFieldValue } from "@/actions/fieldValues";
import { isAiEnabled } from "@/lib/ai/client";
import { Text } from "@/components/ui/text";
import { isTranscriptionEnabled } from "@/lib/transcription/client";

import { HighlightClipStrip } from "@/components/highlights/HighlightClipStrip";
import { FloatingVideo } from "@/components/playback/FloatingVideo";
import { TranscribeButton } from "@/components/attachments/TranscribeButton";

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

  const tagById = new Map(tags.map((t) => [t.id, t]));

  const teamMemberNameById = new Map(teamMembers.map((m) => [m.id, m.name]));
  const speakerMaps = new Map<string, Map<string, string>>();
  const rawSpeakerMaps = new Map<string, Record<string, string>>();
  for (const attachment of note.attachments) {
    const map = attachment.speakerMap as Record<string, string> | null;
    if (!map) continue;
    rawSpeakerMaps.set(attachment.id, map);
    const resolved = new Map<string, string>();
    for (const [label, teamMemberId] of Object.entries(map)) {
      const name = teamMemberNameById.get(teamMemberId);
      if (name) resolved.set(label, name);
    }
    speakerMaps.set(attachment.id, resolved);
  }

  const primaryVideo = note.attachments.find(
    (a) => a.kind === "VIDEO" && a.transcriptionStatus === "DONE",
  ) ?? null;

  const aiEnabled = isAiEnabled();
  const transcriptionEnabled = isTranscriptionEnabled();

  const tagsContent = (
    <div className="flex flex-col gap-2">
      {note.highlights.length === 0 ? (
        <Text size={100} color="subdued">No tags yet. Select text in the transcript and click Tag.</Text>
      ) : (
        note.highlights.map((h) => (
          <HighlightRow
            key={h.id}
            projectId={projectId}
            allTags={tags}
            aiEnabled={aiEnabled}
            highlight={{
              id: h.id,
              quote: h.quote,
              wholeNote: h.wholeNote,
              orphaned: h.orphaned,
              noteId: note.id,
              tagIds: h.tagAssignments.map((t) => t.tagId),
            }}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <NotePageShell
        noteId={note.id}
        initialTitle={note.title}
        aiEnabled={aiEnabled}
        transcriptionEnabled={transcriptionEnabled}
        hasAttachments={note.attachments.length > 0}
        shareLinkEnabled={note.shareLinkEnabled}
        shareLinkToken={note.shareLinkToken ?? null}
        tagsContent={tagsContent}
        editorProps={{
          projectId,
          initialContent: note.content as JSONContent,
          speakerMaps,
          rawSpeakerMaps,
          teamMembers,
          allTags: tags,
          highlights: note.highlights.map((h) => ({
            id: h.id,
            markId: h.markId,
            tagIds: h.tagAssignments.map((t) => t.tagId),
          })),
        }}
      >
        {/* Fields */}
        <NoteFieldsPanel
          fields={fields}
          fieldValues={note.fieldValues.map((fv) => ({
            fieldId: fv.fieldId,
            valueText: fv.valueText ?? null,
            valueNumber: fv.valueNumber ?? null,
            valueDate: fv.valueDate ? fv.valueDate.toISOString().slice(0, 10) : null,
            teamMemberId: fv.teamMemberId ?? null,
            selectedOptionIds: fv.selectedOptions.map((o) => o.fieldOptionId),
          }))}
          teamMembers={teamMembers}
          onSubmit={setNoteFieldValue.bind(null, note.id)}
        />

        {/* Drop zone rendered in NotePageShell (client) so it can fire onUploaded */}

        {/* Attachments */}
        {note.attachments.map((attachment) => {
          const isPrimary = attachment === primaryVideo;
          const isDone = attachment.transcriptionStatus === "DONE";
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
                <FloatingVideo attachmentId={attachment.id} />
                {transcriptionEnabled && !isDone && (
                  <TranscribeButton
                    attachmentId={attachment.id}
                    initialStatus={attachment.transcriptionStatus as "NONE" | "PENDING" | "PROCESSING" | "DONE" | "FAILED"}
                    initialError={attachment.transcriptionError ?? null}
                  />
                )}
                <HighlightClipStrip attachmentId={attachment.id} highlights={clipHighlights} />
              </div>
            );
          }

          return (
            <div key={attachment.id} className="flex flex-col gap-2">
              <MediaPlayer
                attachment={attachment}
                transcriptionEnabled={transcriptionEnabled}
              />
              {attachment.kind === "VIDEO" && (
                <HighlightClipStrip attachmentId={attachment.id} highlights={clipHighlights} />
              )}
            </div>
          );
        })}
      </NotePageShell>
    </div>
  );
}
