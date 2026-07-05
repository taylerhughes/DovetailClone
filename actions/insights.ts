"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { docToPlainText, emptyDoc } from "@/lib/editor/plainText";
import { extractHighlightEmbedIds } from "@/lib/editor/extractIds";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { JSONContent } from "@tiptap/react";

export async function createInsight(projectId: string) {
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

export async function updateInsightTitle(insightId: string, title: string) {
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
  const plainText = docToPlainText(content as never);

  const insight = await db.insight.update({
    where: { id: insightId },
    data: { content, plainText },
    select: { projectId: true },
  });

  await syncInsightHighlights(insightId, content as unknown as JSONContent);

  revalidatePath(`/projects/${insight.projectId}/insights`);
}

export async function deleteInsight(insightId: string) {
  const insight = await db.insight.delete({
    where: { id: insightId },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${insight.projectId}/insights`);
  redirect(`/projects/${insight.projectId}/insights`);
}
