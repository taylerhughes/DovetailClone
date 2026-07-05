"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { requireProjectOwnerAccess } from "@/lib/auth/authorize";
import type { ProjectRole } from "@/lib/generated/prisma/client";

function roleRank(role: ProjectRole): number {
  return role === "EDITOR" ? 1 : 0;
}

function higherRole(a: ProjectRole, b: ProjectRole): ProjectRole {
  return roleRank(a) >= roleRank(b) ? a : b;
}

export async function addProjectShare(
  projectId: string,
  email: string,
  role: ProjectRole,
) {
  const user = await requireUser();
  await requireProjectOwnerAccess(projectId, user.id);

  const target = await db.user.findUnique({ where: { email: email.trim() } });
  if (!target) {
    throw new Error("No account found with that email");
  }

  await db.projectShare.upsert({
    where: { projectId_userId: { projectId, userId: target.id } },
    create: { projectId, userId: target.id, role },
    update: { role },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function removeProjectShare(projectId: string, userId: string) {
  const user = await requireUser();
  await requireProjectOwnerAccess(projectId, user.id);

  await db.projectShare.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function updateProjectShareRole(
  projectId: string,
  userId: string,
  role: ProjectRole,
) {
  const user = await requireUser();
  await requireProjectOwnerAccess(projectId, user.id);

  await db.projectShare.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function setOrgShare(
  projectId: string,
  enabled: boolean,
  role: ProjectRole,
) {
  const user = await requireUser();
  await requireProjectOwnerAccess(projectId, user.id);

  await db.project.update({
    where: { id: projectId },
    data: { orgShareEnabled: enabled, orgShareRole: role },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

export async function setShareLink(
  projectId: string,
  enabled: boolean,
  role: ProjectRole,
) {
  const user = await requireUser();
  await requireProjectOwnerAccess(projectId, user.id);

  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { shareLinkToken: true },
  });
  const token = enabled ? (project.shareLinkToken ?? randomUUID()) : project.shareLinkToken;

  await db.project.update({
    where: { id: projectId },
    data: { shareLinkEnabled: enabled, shareLinkRole: role, shareLinkToken: token },
  });

  revalidatePath(`/projects/${projectId}`);
  return token;
}

export async function regenerateShareLink(projectId: string) {
  const user = await requireUser();
  await requireProjectOwnerAccess(projectId, user.id);

  const token = randomUUID();
  await db.project.update({
    where: { id: projectId },
    data: { shareLinkToken: token },
  });

  revalidatePath(`/projects/${projectId}`);
  return token;
}

// Anyone signed in can redeem a valid, still-enabled share link -- this is
// how "edit via link" is delivered without a separate anonymous-write
// authorization path: redeeming just materializes a normal ProjectShare row,
// so every other action's requireProjectEditAccess check already covers it.
export async function redeemShareLink(token: string) {
  const user = await requireUser();

  const project = await db.project.findUnique({
    where: { shareLinkToken: token },
    select: { id: true, shareLinkEnabled: true, shareLinkRole: true },
  });
  if (!project || !project.shareLinkEnabled) {
    throw new Error("This share link is no longer valid");
  }

  const existing = await db.projectShare.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    select: { role: true },
  });

  await db.projectShare.upsert({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    create: { projectId: project.id, userId: user.id, role: project.shareLinkRole },
    update: {
      role: existing
        ? higherRole(existing.role, project.shareLinkRole)
        : project.shareLinkRole,
    },
  });

  return { projectId: project.id };
}
