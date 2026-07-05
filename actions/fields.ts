"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { colorForIndex } from "@/lib/palette";
import { requireUser } from "@/lib/auth/session";
import { requireProjectAccess } from "@/lib/auth/authorize";
import type { FieldAppliesTo, FieldType } from "@/lib/generated/prisma/client";

async function revalidateProjectFields(projectId: string) {
  revalidatePath(`/projects/${projectId}/fields`);
  revalidatePath(`/projects/${projectId}/data`);
}

async function requireFieldAccess(fieldId: string, userId: string) {
  const field = await db.field.findUniqueOrThrow({
    where: { id: fieldId },
    select: { projectId: true },
  });
  await requireProjectAccess(field.projectId, userId);
  return field;
}

async function requireFieldOptionAccess(optionId: string, userId: string) {
  const option = await db.fieldOption.findUniqueOrThrow({
    where: { id: optionId },
    select: { field: { select: { projectId: true } } },
  });
  await requireProjectAccess(option.field.projectId, userId);
  return option;
}

export async function createField(
  projectId: string,
  name: string,
  type: FieldType,
  appliesTo: FieldAppliesTo = "BOTH",
) {
  const user = await requireUser();
  await requireProjectAccess(projectId, user.id);

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
  const user = await requireUser();
  await requireFieldAccess(fieldId, user.id);

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
  const user = await requireUser();
  await requireFieldAccess(fieldId, user.id);

  const field = await db.field.delete({
    where: { id: fieldId },
    select: { projectId: true },
  });
  await revalidateProjectFields(field.projectId);
}

export async function addFieldOption(fieldId: string, label: string) {
  const user = await requireUser();
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Option label is required");

  const field = await db.field.findUniqueOrThrow({
    where: { id: fieldId },
    select: { projectId: true, _count: { select: { options: true } } },
  });
  await requireProjectAccess(field.projectId, user.id);

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
  const user = await requireUser();
  await requireFieldOptionAccess(optionId, user.id);

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
  const user = await requireUser();
  await requireFieldOptionAccess(optionId, user.id);

  const option = await db.fieldOption.delete({
    where: { id: optionId },
    select: { field: { select: { projectId: true } } },
  });
  await revalidateProjectFields(option.field.projectId);
}
