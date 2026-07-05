import { db } from "@/lib/db";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CapNotice } from "@/components/ui/CapNotice";
import { LIST_RESULT_CAP } from "@/lib/constants";
import { requireUser } from "@/lib/auth/session";
import type { Prisma } from "@/lib/generated/prisma/client";

export default async function Home() {
  const user = await requireUser();

  const memberships = await db.member.findMany({
    where: { userId: user.id },
    include: { organization: { select: { id: true, name: true } } },
  });
  const memberOrgIds = memberships.map((m) => m.organizationId);

  // A project is reachable as its owner, via an individual share, or via a
  // live org membership when the project has org-wide sharing enabled --
  // the same conditions resolveProjectAccess checks per-project.
  const accessWhere: Prisma.ProjectWhereInput = {
    OR: [
      { userId: user.id },
      { shares: { some: { userId: user.id } } },
      { orgShareEnabled: true, organizationId: { in: memberOrgIds } },
    ],
  };

  const [projects, totalProjects] = await Promise.all([
    db.project.findMany({
      where: accessWhere,
      orderBy: { updatedAt: "desc" },
      take: LIST_RESULT_CAP,
      include: {
        _count: { select: { notes: true, insights: true } },
      },
    }),
    db.project.count({ where: accessWhere }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <CreateProjectDialog
          organizations={memberships.map((m) => m.organization)}
        />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground">
            Create a project to start collecting research.
          </p>
        </div>
      ) : (
        <>
          <CapNotice shown={projects.length} total={totalProjects} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                description={project.description}
                noteCount={project._count.notes}
                insightCount={project._count.insights}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
