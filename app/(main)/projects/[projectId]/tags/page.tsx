import { db } from "@/lib/db";
import { TagManager } from "@/components/tags/TagManager";

export default async function TagsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const tags = await db.tag.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <TagManager projectId={projectId} initialTags={tags} />
    </div>
  );
}
