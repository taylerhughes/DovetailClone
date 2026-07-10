"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { requireProjectEditAccess } from "@/lib/auth/authorize";

export async function createIntegration(projectId: string, name: string) {
  const user = await requireUser();
  await requireProjectEditAccess(projectId, user.id);

  const secret = randomBytes(32).toString("hex");
  const integration = await db.integration.create({
    data: {
      userId: user.id,
      projectId,
      provider: "zapier",
      name,
      secret,
    },
  });

  revalidatePath("/integrations");
  redirect(`/integrations/${integration.id}`);
}

export async function deleteIntegration(id: string) {
  const user = await requireUser();
  const integration = await db.integration.findUniqueOrThrow({
    where: { id },
    select: { userId: true, projectId: true },
  });
  await requireProjectEditAccess(integration.projectId, user.id);

  await db.integration.delete({ where: { id } });
  revalidatePath("/integrations");
  redirect("/integrations");
}

export async function toggleIntegration(id: string, enabled: boolean) {
  const user = await requireUser();
  const integration = await db.integration.findUniqueOrThrow({
    where: { id },
    select: { projectId: true },
  });
  await requireProjectEditAccess(integration.projectId, user.id);

  await db.integration.update({ where: { id }, data: { enabled } });
  revalidatePath("/integrations");
  revalidatePath(`/integrations/${id}`);
}
