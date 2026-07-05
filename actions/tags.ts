"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { colorForIndex } from "@/lib/palette";
import { requireUser } from "@/lib/auth/session";
import { requireProjectEditAccess } from "@/lib/auth/authorize";

export async function createTag(
  projectId: string,
  name: string,
  parentId?: string | null,
) {
  const user = await requireUser();
  await requireProjectEditAccess(projectId, user.id);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required");

  const count = await db.tag.count({ where: { projectId } });

  const tag = await db.tag.create({
    data: {
      projectId,
      name: trimmed,
      color: colorForIndex(count),
      parentId: parentId ?? null,
    },
  });

  revalidatePath(`/projects/${projectId}/tags`);
  return tag;
}

async function requireTagAccess(tagId: string, userId: string) {
  const tag = await db.tag.findUniqueOrThrow({
    where: { id: tagId },
    select: { projectId: true, parentId: true },
  });
  await requireProjectEditAccess(tag.projectId, userId);
  return tag;
}

export async function renameTag(tagId: string, name: string) {
  const user = await requireUser();
  await requireTagAccess(tagId, user.id);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required");

  const tag = await db.tag.update({
    where: { id: tagId },
    data: { name: trimmed },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${tag.projectId}/tags`);
}

export async function setTagParent(tagId: string, parentId: string | null) {
  const user = await requireUser();
  await requireTagAccess(tagId, user.id);

  if (parentId === tagId) throw new Error("A tag cannot be its own parent");

  if (parentId) {
    const targetParent = await requireTagAccess(parentId, user.id);
    if (targetParent.parentId) {
      throw new Error("Tags only support one level of nesting");
    }
  }

  const tag = await db.tag.update({
    where: { id: tagId },
    data: { parentId },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${tag.projectId}/tags`);
}

export async function recolorTag(tagId: string, color: string) {
  const user = await requireUser();
  await requireTagAccess(tagId, user.id);

  const tag = await db.tag.update({
    where: { id: tagId },
    data: { color },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${tag.projectId}/tags`);
}

export async function deleteTag(tagId: string) {
  const user = await requireUser();
  await requireTagAccess(tagId, user.id);

  const tag = await db.tag.delete({
    where: { id: tagId },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${tag.projectId}/tags`);
  revalidatePath(`/projects/${tag.projectId}/highlights`);
}
