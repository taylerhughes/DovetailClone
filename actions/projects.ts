"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import {
  requireProjectEditAccess,
  requireProjectOwnerAccess,
} from "@/lib/auth/authorize";

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    throw new Error("Project name is required");
  }

  const project = await db.project.create({
    data: { name, description: description || null, userId: user.id },
  });

  revalidatePath("/");
  redirect(`/projects/${project.id}`);
}

export async function renameProject(projectId: string, name: string) {
  const user = await requireUser();
  await requireProjectEditAccess(projectId, user.id);

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Project name is required");
  }

  await db.project.update({
    where: { id: projectId },
    data: { name: trimmed },
  });

  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
}

export async function updateProjectDescription(
  projectId: string,
  description: string,
) {
  const user = await requireUser();
  await requireProjectEditAccess(projectId, user.id);

  await db.project.update({
    where: { id: projectId },
    data: { description: description.trim() || null },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const user = await requireUser();
  await requireProjectOwnerAccess(projectId, user.id);

  await db.project.delete({ where: { id: projectId } });

  revalidatePath("/");
  redirect("/");
}
