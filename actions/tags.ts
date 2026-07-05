"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { colorForIndex } from "@/lib/palette";

export async function createTag(
  projectId: string,
  name: string,
  parentId?: string | null,
) {
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

export async function renameTag(tagId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required");

  const tag = await db.tag.update({
    where: { id: tagId },
    data: { name: trimmed },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${tag.projectId}/tags`);
}

export async function recolorTag(tagId: string, color: string) {
  const tag = await db.tag.update({
    where: { id: tagId },
    data: { color },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${tag.projectId}/tags`);
}

export async function deleteTag(tagId: string) {
  const tag = await db.tag.delete({
    where: { id: tagId },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${tag.projectId}/tags`);
  revalidatePath(`/projects/${tag.projectId}/highlights`);
}
