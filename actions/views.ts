"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
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

export async function createView(
  projectId: string,
  entityType: ViewEntityType,
  layout: ViewLayout,
  name: string,
) {
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
  const trimmed = name.trim();
  if (!trimmed) throw new Error("View name is required");

  const view = await db.view.update({
    where: { id: viewId },
    data: { name: trimmed },
  });
  revalidatePath(`/projects/${view.projectId}/${tabPathFor(view.entityType)}`);
}

export async function deleteView(viewId: string) {
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
