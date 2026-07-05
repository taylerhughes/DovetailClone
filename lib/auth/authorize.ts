import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export async function requireProjectAccess(projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) notFound();
}
