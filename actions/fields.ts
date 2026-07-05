"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { colorForIndex } from "@/lib/palette";
import type { FieldAppliesTo, FieldType } from "@/lib/generated/prisma/client";

async function revalidateProjectFields(projectId: string) {
  revalidatePath(`/projects/${projectId}/fields`);
  revalidatePath(`/projects/${projectId}/data`);
}

export async function createField(
  projectId: string,
  name: string,
  type: FieldType,
  appliesTo: FieldAppliesTo = "BOTH",
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Field name is required");

  const order = await db.field.count({ where: { projectId } });
  const field = await db.field.create({
    data: { projectId, name: trimmed, type, appliesTo, order },
  });

  await revalidateProjectFields(projectId);
  return field;
}

export async function renameField(fieldId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Field name is required");

  const field = await db.field.update({
    where: { id: fieldId },
    data: { name: trimmed },
    select: { projectId: true },
  });
  await revalidateProjectFields(field.projectId);
}

export async function deleteField(fieldId: string) {
  const field = await db.field.delete({
    where: { id: fieldId },
    select: { projectId: true },
  });
  await revalidateProjectFields(field.projectId);
}

export async function addFieldOption(fieldId: string, label: string) {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Option label is required");

  const field = await db.field.findUniqueOrThrow({
    where: { id: fieldId },
    select: { projectId: true, _count: { select: { options: true } } },
  });

  const option = await db.fieldOption.create({
    data: {
      fieldId,
      label: trimmed,
      color: colorForIndex(field._count.options),
      order: field._count.options,
    },
  });

  await revalidateProjectFields(field.projectId);
  return option;
}

export async function renameFieldOption(optionId: string, label: string) {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Option label is required");

  const option = await db.fieldOption.update({
    where: { id: optionId },
    data: { label: trimmed },
    select: { field: { select: { projectId: true } } },
  });
  await revalidateProjectFields(option.field.projectId);
}

export async function deleteFieldOption(optionId: string) {
  const option = await db.fieldOption.delete({
    where: { id: optionId },
    select: { field: { select: { projectId: true } } },
  });
  await revalidateProjectFields(option.field.projectId);
}
