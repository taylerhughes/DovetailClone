import { db } from "@/lib/db";
import { FieldManager } from "@/components/fields/FieldManager";

export default async function FieldsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const fields = await db.field.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <FieldManager projectId={projectId} initialFields={fields} />
    </div>
  );
}
