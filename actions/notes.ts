"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { docToPlainText, emptyDoc } from "@/lib/editor/plainText";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function createNote(projectId: string) {
  const note = await db.note.create({
    data: {
      projectId,
      title: "Untitled",
      content: emptyDoc as unknown as Prisma.InputJsonValue,
      plainText: "",
    },
  });

  revalidatePath(`/projects/${projectId}/data`);
  redirect(`/projects/${projectId}/data/${note.id}`);
}

export async function updateNoteTitle(noteId: string, title: string) {
  const note = await db.note.update({
    where: { id: noteId },
    data: { title: title.trim() || "Untitled" },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${note.projectId}/data`);
}

export async function updateNoteContent(
  noteId: string,
  content: Prisma.InputJsonValue,
) {
  const plainText = docToPlainText(content as never);

  const note = await db.note.update({
    where: { id: noteId },
    data: { content, plainText },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${note.projectId}/data`);
}

export async function deleteNote(noteId: string) {
  const note = await db.note.delete({
    where: { id: noteId },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${note.projectId}/data`);
  redirect(`/projects/${note.projectId}/data`);
}
