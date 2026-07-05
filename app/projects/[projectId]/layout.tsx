import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectSettings } from "@/components/projects/ProjectSettings";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { requireUser } from "@/lib/auth/session";
import { requireProjectViewAccess } from "@/lib/auth/authorize";
import { ProjectAccessProvider } from "@/components/projects/ProjectAccessContext";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const level = await requireProjectViewAccess(projectId, user.id);
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    notFound();
  }

  return (
    <ProjectAccessProvider
      value={{ level, canEdit: level === "owner" || level === "editor" }}
    >
      <div className="flex flex-1 flex-col">
        <div className="border-b px-8 pt-6">
          <div className="mx-auto flex w-full max-w-5xl items-start justify-between">
            <div>
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← All projects
              </Link>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">
                {project.name}
              </h1>
            </div>
            <ProjectSettings
              projectId={project.id}
              name={project.name}
              description={project.description}
            />
          </div>
          <div className="mx-auto w-full max-w-5xl">
            <ProjectTabs projectId={project.id} />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-8">
          {children}
        </div>
      </div>
    </ProjectAccessProvider>
  );
}
