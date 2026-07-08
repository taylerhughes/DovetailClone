import { EntityCard } from "@/components/cards/EntityCard";
import { Text } from "@/components/ui/text";

export function GridView({
  basePath,
  records,
  emptyLabel = "No notes match this view",
}: {
  basePath: string;
  records: { id: string; title: string; plainText: string; videoAttachmentId?: string | null }[];
  emptyLabel?: string;
}) {
  if (records.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
        <Text size={100} weight="medium">{emptyLabel}</Text>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {records.map((record) => (
        <EntityCard
          key={record.id}
          href={`${basePath}/${record.id}`}
          title={record.title}
          subtitle={record.plainText}
          thumbnailSrc={record.videoAttachmentId ? `/api/attachments/${record.videoAttachmentId}/thumbnail` : undefined}
        />
      ))}
    </div>
  );
}
