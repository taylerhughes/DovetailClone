import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectSettings } from "@/components/projects/ProjectSettings";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { ShareDialog } from "@/components/projects/ShareDialog";
import { requireUser } from "@/lib/auth/session";
import { requireProjectViewAccess } from "@/lib/auth/authorize";
import { ProjectAccessProvider } from "@/components/projects/ProjectAccessContext";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { StickyHeaderMeasurer } from "@/components/layout/StickyHeaderMeasurer";
import { ProjectHeader } from "@/components/projects/ProjectHeader";

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
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      organization: { select: { name: true } },
      shares: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <ProjectAccessProvider
      value={{ level, canEdit: level === "owner" || level === "editor" }}
    >
      <div className="flex flex-1 flex-col">
        <ProjectHeader>
        <StickyHeaderMeasurer
          variable="--project-header-height"
          className="sticky top-14 z-30 border-b bg-background px-8 pt-6"
        >
          <div className="mx-auto flex w-full max-w-5xl items-start justify-between">
            <div>
              <Link href="/">
                <Text as="span" size={75} color="subdued">← All projects</Text>
              </Link>
              <Heading level={1} size={700} className="mt-1">{project.name}</Heading>
            </div>
            <div className="flex items-center gap-2">
              {level === "owner" && (
                <ShareDialog
                  projectId={project.id}
                  shares={project.shares.map((s) => ({
                    userId: s.userId,
                    name: s.user.name,
                    email: s.user.email,
                    role: s.role,
                  }))}
                  organizationName={project.organization?.name ?? null}
                  orgShareEnabled={project.orgShareEnabled}
                  orgShareRole={project.orgShareRole}
                  shareLinkEnabled={project.shareLinkEnabled}
                  shareLinkToken={project.shareLinkToken}
                  shareLinkRole={project.shareLinkRole}
                />
              )}
              <ProjectSettings
                projectId={project.id}
                name={project.name}
                description={project.description}
              />
            </div>
          </div>
          <div className="mx-auto w-full max-w-5xl">
            <ProjectTabs projectId={project.id} />
          </div>
        </StickyHeaderMeasurer>
        </ProjectHeader>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          {children}
        </div>
      </div>
    </ProjectAccessProvider>
  );
}
