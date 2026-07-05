"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { colorForIndex } from "@/lib/palette";
import { requireUser } from "@/lib/auth/session";
import { requireProjectAccess } from "@/lib/auth/authorize";

async function requireTeamMemberAccess(memberId: string, userId: string) {
  const member = await db.teamMember.findUniqueOrThrow({
    where: { id: memberId },
    select: { projectId: true },
  });
  await requireProjectAccess(member.projectId, userId);
  return member;
}

export async function createTeamMember(projectId: string, name: string) {
  const user = await requireUser();
  await requireProjectAccess(projectId, user.id);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const count = await db.teamMember.count({ where: { projectId } });
  const member = await db.teamMember.create({
    data: { projectId, name: trimmed, color: colorForIndex(count) },
  });

  revalidatePath(`/projects/${projectId}/team`);
  return member;
}

export async function renameTeamMember(memberId: string, name: string) {
  const user = await requireUser();
  await requireTeamMemberAccess(memberId, user.id);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const member = await db.teamMember.update({
    where: { id: memberId },
    data: { name: trimmed },
    select: { projectId: true },
  });
  revalidatePath(`/projects/${member.projectId}/team`);
}

export async function deleteTeamMember(memberId: string) {
  const user = await requireUser();
  await requireTeamMemberAccess(memberId, user.id);

  const member = await db.teamMember.delete({
    where: { id: memberId },
    select: { projectId: true },
  });
  revalidatePath(`/projects/${member.projectId}/team`);
  revalidatePath(`/projects/${member.projectId}/data`);
}
