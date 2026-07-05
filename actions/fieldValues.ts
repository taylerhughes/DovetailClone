"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type FieldValueInput =
  | { kind: "TEXT"; value: string }
  | { kind: "NUMBER"; value: number | null }
  | { kind: "DATE"; value: string | null }
  | { kind: "SINGLE_SELECT"; optionId: string | null }
  | { kind: "MULTI_SELECT"; optionId: string; checked: boolean }
  | { kind: "PERSON"; teamMemberId: string | null };

async function ensureNoteFieldValue(noteId: string, fieldId: string) {
  return db.noteFieldValue.upsert({
    where: { noteId_fieldId: { noteId, fieldId } },
    create: { noteId, fieldId },
    update: {},
  });
}

export async function setNoteFieldValue(
  noteId: string,
  fieldId: string,
  input: FieldValueInput,
) {
  const note = await db.note.findUniqueOrThrow({
    where: { id: noteId },
    select: { projectId: true },
  });

  switch (input.kind) {
    case "TEXT": {
      await db.noteFieldValue.upsert({
        where: { noteId_fieldId: { noteId, fieldId } },
        create: { noteId, fieldId, valueText: input.value },
        update: { valueText: input.value },
      });
      break;
    }
    case "NUMBER": {
      await db.noteFieldValue.upsert({
        where: { noteId_fieldId: { noteId, fieldId } },
        create: { noteId, fieldId, valueNumber: input.value },
        update: { valueNumber: input.value },
      });
      break;
    }
    case "DATE": {
      await db.noteFieldValue.upsert({
        where: { noteId_fieldId: { noteId, fieldId } },
        create: {
          noteId,
          fieldId,
          valueDate: input.value ? new Date(input.value) : null,
        },
        update: { valueDate: input.value ? new Date(input.value) : null },
      });
      break;
    }
    case "PERSON": {
      await db.noteFieldValue.upsert({
        where: { noteId_fieldId: { noteId, fieldId } },
        create: { noteId, fieldId, teamMemberId: input.teamMemberId },
        update: { teamMemberId: input.teamMemberId },
      });
      break;
    }
    case "SINGLE_SELECT": {
      const fieldValue = await ensureNoteFieldValue(noteId, fieldId);
      await db.noteFieldValueOption.deleteMany({
        where: { noteFieldValueId: fieldValue.id },
      });
      if (input.optionId) {
        await db.noteFieldValueOption.create({
          data: { noteFieldValueId: fieldValue.id, fieldOptionId: input.optionId },
        });
      }
      break;
    }
    case "MULTI_SELECT": {
      const fieldValue = await ensureNoteFieldValue(noteId, fieldId);
      if (input.checked) {
        await db.noteFieldValueOption.upsert({
          where: {
            noteFieldValueId_fieldOptionId: {
              noteFieldValueId: fieldValue.id,
              fieldOptionId: input.optionId,
            },
          },
          create: {
            noteFieldValueId: fieldValue.id,
            fieldOptionId: input.optionId,
          },
          update: {},
        });
      } else {
        await db.noteFieldValueOption.deleteMany({
          where: {
            noteFieldValueId: fieldValue.id,
            fieldOptionId: input.optionId,
          },
        });
      }
      break;
    }
  }

  revalidatePath(`/projects/${note.projectId}/data`);
}
