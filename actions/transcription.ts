"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { syncHighlightsForNote } from "@/actions/highlights";
import { docToPlainText } from "@/lib/editor/plainText";
import { getAssemblyAiClient, isTranscriptionEnabled } from "@/lib/transcription/client";
import {
  buildTranscriptSegments,
  appendTranscriptToDoc,
} from "@/lib/transcription/buildTranscriptDoc";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { JSONContent } from "@tiptap/react";

export async function transcribeAttachment(attachmentId: string) {
  if (!isTranscriptionEnabled()) {
    throw new Error("Transcription is disabled: ASSEMBLYAI_API_KEY is not set.");
  }

  const attachment = await db.attachment.update({
    where: { id: attachmentId },
    data: { transcriptionStatus: "PENDING", transcriptionError: null },
    select: { noteId: true, note: { select: { projectId: true } } },
  });

  revalidatePath(
    `/projects/${attachment.note.projectId}/data/${attachment.noteId}`,
  );

  // Long-running self-hosted Node process, not a serverless function — this
  // detached task keeps running after the action returns; the client polls
  // the transcription-status route for completion.
  void processTranscription(attachmentId);
}

export async function setSpeakerMapping(
  attachmentId: string,
  speakerLabel: string,
  teamMemberId: string | null,
) {
  const attachment = await db.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
    select: { speakerMap: true, noteId: true, note: { select: { projectId: true } } },
  });

  const speakerMap = { ...(attachment.speakerMap as Record<string, string> | null) };
  if (teamMemberId) {
    speakerMap[speakerLabel] = teamMemberId;
  } else {
    delete speakerMap[speakerLabel];
  }

  await db.attachment.update({
    where: { id: attachmentId },
    data: { speakerMap },
  });

  revalidatePath(
    `/projects/${attachment.note.projectId}/data/${attachment.noteId}`,
  );
}

async function processTranscription(attachmentId: string) {
  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
  });
  if (!attachment) return;

  try {
    await db.attachment.update({
      where: { id: attachmentId },
      data: { transcriptionStatus: "PROCESSING" },
    });

    const buffer = await storage.read(attachment.storageKey);
    const client = getAssemblyAiClient();
    const transcript = await client.transcripts.transcribe({
      audio: buffer,
      speaker_labels: true,
    });

    if (transcript.status === "error") {
      throw new Error(transcript.error ?? "Transcription failed");
    }

    const utterances = (transcript.utterances ?? []).map((u) => ({
      speaker: u.speaker,
      text: u.text,
      startSec: u.start / 1000,
      endSec: u.end / 1000,
    }));
    const segments = buildTranscriptSegments(utterances, attachmentId);

    const note = await db.note.findUniqueOrThrow({
      where: { id: attachment.noteId },
      select: { content: true },
    });
    const nextDoc = appendTranscriptToDoc(note.content as JSONContent, segments);
    const plainText = docToPlainText(nextDoc as never);

    // Note: this intentionally does NOT reuse the `updateNoteContent` server
    // action, since that action calls `revalidatePath` — which throws when
    // called from a detached background task with no active request/render
    // context. The client instead polls transcription-status and calls
    // `router.refresh()` on completion, which re-fetches fresh data directly.
    await db.note.update({
      where: { id: attachment.noteId },
      data: {
        content: nextDoc as unknown as Prisma.InputJsonValue,
        plainText,
      },
    });
    await syncHighlightsForNote(attachment.noteId, nextDoc);

    await db.attachment.update({
      where: { id: attachmentId },
      data: { transcriptionStatus: "DONE" },
    });
  } catch (err) {
    console.error("processTranscription failed", err);
    await db.attachment.update({
      where: { id: attachmentId },
      data: {
        transcriptionStatus: "FAILED",
        transcriptionError:
          err instanceof Error ? err.message : "Transcription failed",
      },
    });
  }
}
