import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export async function hasProjectAccess(projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return Boolean(project);
}

export async function requireProjectAccess(projectId: string, userId: string) {
  if (!(await hasProjectAccess(projectId, userId))) notFound();
}
