import { db } from "@/lib/db";
import { TeamManager } from "@/components/team/TeamManager";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const members = await db.teamMember.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <TeamManager projectId={projectId} initialMembers={members} />
    </div>
  );
}
