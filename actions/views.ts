"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { requireProjectAccess } from "@/lib/auth/authorize";
import type {
  ViewEntityType,
  ViewLayout,
  Prisma,
} from "@/lib/generated/prisma/client";
import type { FilterRule, SortDirection } from "@/lib/views/types";

function tabPathFor(entityType: ViewEntityType) {
  switch (entityType) {
    case "NOTE":
      return "data";
    case "HIGHLIGHT":
      return "highlights";
    case "INSIGHT":
      return "insights";
  }
}

async function requireViewAccess(viewId: string, userId: string) {
  const view = await db.view.findUniqueOrThrow({ where: { id: viewId } });
  await requireProjectAccess(view.projectId, userId);
  return view;
}

export async function createView(
  projectId: string,
  entityType: ViewEntityType,
  layout: ViewLayout,
  name: string,
) {
  const user = await requireUser();
  await requireProjectAccess(projectId, user.id);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("View name is required");

  const order = await db.view.count({ where: { projectId, entityType } });
  const view = await db.view.create({
    data: { projectId, entityType, layout, name: trimmed, order },
  });

  revalidatePath(`/projects/${projectId}/${tabPathFor(entityType)}`);
  return view;
}

export async function renameView(viewId: string, name: string) {
  const user = await requireUser();
  await requireViewAccess(viewId, user.id);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("View name is required");

  const view = await db.view.update({
    where: { id: viewId },
    data: { name: trimmed },
  });
  revalidatePath(`/projects/${view.projectId}/${tabPathFor(view.entityType)}`);
}

export async function deleteView(viewId: string) {
  const user = await requireUser();
  await requireViewAccess(viewId, user.id);

  const view = await db.view.delete({ where: { id: viewId } });
  revalidatePath(`/projects/${view.projectId}/${tabPathFor(view.entityType)}`);
}

export async function updateViewConfig(
  viewId: string,
  config: {
    groupByFieldId?: string | null;
    sortFieldId?: string | null;
    sortDirection?: SortDirection | null;
    filterConfig?: FilterRule[];
  },
) {
  const user = await requireUser();
  await requireViewAccess(viewId, user.id);

  const data: Prisma.ViewUpdateInput = {};
  if ("groupByFieldId" in config) {
    data.groupByField = config.groupByFieldId
      ? { connect: { id: config.groupByFieldId } }
      : { disconnect: true };
  }
  if ("sortFieldId" in config) {
    data.sortField = config.sortFieldId
      ? { connect: { id: config.sortFieldId } }
      : { disconnect: true };
  }
  if ("sortDirection" in config) {
    data.sortDirection = config.sortDirection;
  }
  if (config.filterConfig) {
    data.filterConfig = config.filterConfig as unknown as Prisma.InputJsonValue;
  }

  const view = await db.view.update({ where: { id: viewId }, data });
  revalidatePath(`/projects/${view.projectId}/${tabPathFor(view.entityType)}`);
}
