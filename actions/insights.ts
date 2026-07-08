"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { docToPlainText, emptyDoc } from "@/lib/editor/plainText";
import { extractHighlightEmbedIds } from "@/lib/editor/extractIds";
import { syncInsightEmbeddings } from "@/lib/embeddings/sync";
import { deleteEmbeddingsForInsight } from "@/lib/embeddings/cleanup";
import { requireUser } from "@/lib/auth/session";
import { requireProjectEditAccess } from "@/lib/auth/authorize";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { JSONContent } from "@tiptap/react";

export async function createInsight(projectId: string) {
  const user = await requireUser();
  await requireProjectEditAccess(projectId, user.id);

  const insight = await db.insight.create({
    data: {
      projectId,
      title: "Untitled insight",
      content: emptyDoc as unknown as Prisma.InputJsonValue,
      plainText: "",
    },
  });

  revalidatePath(`/projects/${projectId}/insights`);
  redirect(`/projects/${projectId}/insights/${insight.id}`);
}

async function requireInsightAccess(insightId: string, userId: string) {
  const insight = await db.insight.findUniqueOrThrow({
    where: { id: insightId },
    select: { projectId: true },
  });
  await requireProjectEditAccess(insight.projectId, userId);
  return insight;
}

export async function updateInsightTitle(insightId: string, title: string) {
  const user = await requireUser();
  await requireInsightAccess(insightId, user.id);

  const insight = await db.insight.update({
    where: { id: insightId },
    data: { title: title.trim() || "Untitled insight" },
    select: { projectId: true },
  });
  revalidatePath(`/projects/${insight.projectId}/insights`);
}

async function syncInsightHighlights(insightId: string, doc: JSONContent) {
  const embeddedIds = new Set(extractHighlightEmbedIds(doc));
  const existing = await db.insightHighlight.findMany({
    where: { insightId },
    select: { highlightId: true },
  });
  const existingIds = new Set(existing.map((e) => e.highlightId));

  const toAdd = [...embeddedIds].filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !embeddedIds.has(id));

  await db.$transaction([
    ...toAdd.map((highlightId) =>
      db.insightHighlight.create({ data: { insightId, highlightId } }),
    ),
    ...toRemove.map((highlightId) =>
      db.insightHighlight.delete({
        where: { insightId_highlightId: { insightId, highlightId } },
      }),
    ),
  ]);
}

export async function updateInsightContent(
  insightId: string,
  content: Prisma.InputJsonValue,
) {
  const user = await requireUser();
  await requireInsightAccess(insightId, user.id);

  const plainText = docToPlainText(content as never);

  const insight = await db.insight.update({
    where: { id: insightId },
    data: { content, plainText },
    select: { projectId: true },
  });

  await syncInsightHighlights(insightId, content as unknown as JSONContent);
  void syncInsightEmbeddings(insightId);

  revalidatePath(`/projects/${insight.projectId}/insights`);
}

export async function deleteInsight(insightId: string) {
  const user = await requireUser();
  await requireInsightAccess(insightId, user.id);

  const insight = await db.insight.delete({
    where: { id: insightId },
    select: { projectId: true },
  });
  await deleteEmbeddingsForInsight(insightId);
  // The FK cascade only covers InsightConflict rows owned by this insight
  // (insightId). If some other insight's conflict points at this one as the
  // conflicting evidence (conflictingType="INSIGHT"), that's a polymorphic,
  // FK-less reference needing the same explicit cleanup as the highlight case.
  await db.insightConflict.deleteMany({
    where: { conflictingType: "INSIGHT", conflictingId: insightId },
  });

  revalidatePath(`/projects/${insight.projectId}/insights`);
  redirect(`/projects/${insight.projectId}/insights`);
}
