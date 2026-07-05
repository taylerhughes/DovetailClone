"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { CanvasSubjectType } from "@/lib/generated/prisma/client";

async function tabPathFor(viewId: string) {
  const view = await db.view.findUniqueOrThrow({
    where: { id: viewId },
    select: {
      projectId: true,
      entityType: true,
    },
  });
  const slug =
    view.entityType === "NOTE"
      ? "data"
      : view.entityType === "INSIGHT"
        ? "insights"
        : "highlights";
  return `/projects/${view.projectId}/${slug}`;
}

export async function updateCardPosition(
  viewId: string,
  subjectType: CanvasSubjectType,
  subjectId: string,
  x: number,
  y: number,
) {
  await db.canvasCardPosition.upsert({
    where: { viewId_subjectType_subjectId: { viewId, subjectType, subjectId } },
    create: { viewId, subjectType, subjectId, x, y },
    update: { x, y },
  });
  revalidatePath(await tabPathFor(viewId));
}

export async function addToCanvas(
  viewId: string,
  subjectType: CanvasSubjectType,
  subjectId: string,
) {
  const count = await db.canvasCardPosition.count({ where: { viewId } });
  const offset = (count % 10) * 24;
  await db.canvasCardPosition.create({
    data: {
      viewId,
      subjectType,
      subjectId,
      x: 40 + offset,
      y: 40 + offset,
    },
  });
  revalidatePath(await tabPathFor(viewId));
}

export async function removeFromCanvas(
  viewId: string,
  subjectType: CanvasSubjectType,
  subjectId: string,
) {
  await db.canvasCardPosition.delete({
    where: { viewId_subjectType_subjectId: { viewId, subjectType, subjectId } },
  });
  revalidatePath(await tabPathFor(viewId));
}
