"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { requireProjectEditAccess } from "@/lib/auth/authorize";

export async function dismissInsightConflict(conflictId: string) {
  const user = await requireUser();
  const conflict = await db.insightConflict.findUniqueOrThrow({
    where: { id: conflictId },
    select: { insight: { select: { id: true, projectId: true } } },
  });
  await requireProjectEditAccess(conflict.insight.projectId, user.id);

  await db.insightConflict.update({
    where: { id: conflictId },
    data: { dismissed: true, dismissedAt: new Date() },
  });

  revalidatePath(`/projects/${conflict.insight.projectId}/insights/${conflict.insight.id}`);
}
