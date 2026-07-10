"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { requireProjectEditAccess } from "@/lib/auth/authorize";

async function getProjectIdForNote(noteId: string) {
  const note = await db.note.findUniqueOrThrow({
    where: { id: noteId },
    select: { projectId: true },
  });
  return note.projectId;
}

export async function setNoteShareLink(noteId: string, enabled: boolean) {
  const user = await requireUser();
  const projectId = await getProjectIdForNote(noteId);
  await requireProjectEditAccess(projectId, user.id);

  const note = await db.note.findUniqueOrThrow({
    where: { id: noteId },
    select: { shareLinkToken: true },
  });
  const token = enabled ? (note.shareLinkToken ?? randomUUID()) : note.shareLinkToken;

  await db.note.update({
    where: { id: noteId },
    data: { shareLinkEnabled: enabled, shareLinkToken: token },
  });

  revalidatePath(`/projects/${projectId}/data/${noteId}`);
  return token;
}

export async function regenerateNoteShareLink(noteId: string) {
  const user = await requireUser();
  const projectId = await getProjectIdForNote(noteId);
  await requireProjectEditAccess(projectId, user.id);

  const token = randomUUID();
  await db.note.update({ where: { id: noteId }, data: { shareLinkToken: token } });

  revalidatePath(`/projects/${projectId}/data/${noteId}`);
  return token;
}
