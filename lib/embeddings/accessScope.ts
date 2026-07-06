import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Resolves the set of project ids a user can reach -- as owner, via an
 * individual ProjectShare, or via a live org membership when the project has
 * org-wide sharing enabled -- the same three conditions app/page.tsx's
 * project list query and resolveProjectAccess check per-project. Retrieval
 * (chat, contradiction detection) pre-filters on this list before ranking by
 * vector distance, so it never surfaces content from an inaccessible project.
 */
export async function getAccessibleProjectIds(userId: string): Promise<string[]> {
  const memberships = await db.member.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  const memberOrgIds = memberships.map((m) => m.organizationId);

  const accessWhere: Prisma.ProjectWhereInput = {
    OR: [
      { userId },
      { shares: { some: { userId } } },
      { orgShareEnabled: true, organizationId: { in: memberOrgIds } },
    ],
  };

  const projects = await db.project.findMany({
    where: accessWhere,
    select: { id: true },
  });

  return projects.map((p) => p.id);
}
