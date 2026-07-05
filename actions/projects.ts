"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    throw new Error("Project name is required");
  }

  const project = await db.project.create({
    data: { name, description: description || null },
  });

  revalidatePath("/");
  redirect(`/projects/${project.id}`);
}

export async function renameProject(projectId: string, name: string) {
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
  await db.project.update({
    where: { id: projectId },
    data: { description: description.trim() || null },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await db.project.delete({ where: { id: projectId } });

  revalidatePath("/");
  redirect("/");
}
