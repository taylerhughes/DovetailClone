import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectSettings } from "@/components/projects/ProjectSettings";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <ProjectSettings
          projectId={project.id}
          name={project.name}
          description={project.description}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Notes, highlights, and insights for this project will show up here.
      </p>
    </main>
  );
}
