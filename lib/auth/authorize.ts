import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export type ProjectAccessLevel = "owner" | "editor" | "viewer" | "none";

// Always resolved live against current ownership/share/membership rows --
// never gated on session.activeOrganizationId, which only tracks which
// org's UI a user is currently looking at, not what they're allowed to
// reach. This also means removing someone from an org (or deleting a
// share) revokes their derived access immediately, with no cleanup step.
export async function resolveProjectAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccessLevel> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      userId: true,
      organizationId: true,
      orgShareEnabled: true,
      orgShareRole: true,
    },
  });
  if (!project) return "none";
  if (project.userId === userId) return "owner";

  const share = await db.projectShare.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  if (share) return share.role === "EDITOR" ? "editor" : "viewer";

  if (project.organizationId && project.orgShareEnabled) {
    const member = await db.member.findFirst({
      where: { organizationId: project.organizationId, userId },
      select: { id: true },
    });
    if (member) return project.orgShareRole === "EDITOR" ? "editor" : "viewer";
  }

  return "none";
}

export async function hasProjectViewAccess(projectId: string, userId: string) {
  return (await resolveProjectAccess(projectId, userId)) !== "none";
}

export async function hasProjectEditAccess(projectId: string, userId: string) {
  const level = await resolveProjectAccess(projectId, userId);
  return level === "owner" || level === "editor";
}

// For Server Components/pages: rejects with notFound() rather than leaking
// whether a project exists to someone with no access at all.
export async function requireProjectViewAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccessLevel> {
  const level = await resolveProjectAccess(projectId, userId);
  if (level === "none") notFound();
  return level;
}

// For Server Actions (mutations). Viewers get a plain thrown Error --
// consistent with this codebase's existing convention of throwing plain
// Errors for validation failures, surfaced via the root error boundary.
export async function requireProjectEditAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccessLevel> {
  const level = await requireProjectViewAccess(projectId, userId);
  if (level === "viewer") {
    throw new Error("You only have view access to this project");
  }
  return level;
}

// For actions that control who else can reach the project (deleting it,
// changing its sharing settings) -- an Editor must never be able to do
// these, only the owner.
export async function requireProjectOwnerAccess(
  projectId: string,
  userId: string,
): Promise<void> {
  const level = await requireProjectViewAccess(projectId, userId);
  if (level !== "owner") {
    throw new Error("Only the project owner can do this");
  }
}
