"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { requireProjectAccess } from "@/lib/auth/authorize";
import type { CanvasSubjectType } from "@/lib/generated/prisma/client";

async function requireCanvasViewAccess(viewId: string, userId: string) {
  const view = await db.view.findUniqueOrThrow({
    where: { id: viewId },
    select: {
      projectId: true,
      entityType: true,
    },
  });
  await requireProjectAccess(view.projectId, userId);

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
  const user = await requireUser();
  const tabPath = await requireCanvasViewAccess(viewId, user.id);

  await db.canvasCardPosition.upsert({
    where: { viewId_subjectType_subjectId: { viewId, subjectType, subjectId } },
    create: { viewId, subjectType, subjectId, x, y },
    update: { x, y },
  });
  revalidatePath(tabPath);
}

export async function addToCanvas(
  viewId: string,
  subjectType: CanvasSubjectType,
  subjectId: string,
) {
  const user = await requireUser();
  const tabPath = await requireCanvasViewAccess(viewId, user.id);

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
  revalidatePath(tabPath);
}

export async function removeFromCanvas(
  viewId: string,
  subjectType: CanvasSubjectType,
  subjectId: string,
) {
  const user = await requireUser();
  const tabPath = await requireCanvasViewAccess(viewId, user.id);

  await db.canvasCardPosition.delete({
    where: { viewId_subjectType_subjectId: { viewId, subjectType, subjectId } },
  });
  revalidatePath(tabPath);
}
