import Link from "next/link";
import { Text } from "@/components/ui/text";

export function ListView({
  basePath,
  records,
  emptyLabel = "No notes match this view",
}: {
  basePath: string;
  records: { id: string; title: string; plainText: string }[];
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
    <div className="flex flex-col divide-y rounded-lg border">
      {records.map((record) => (
        <Link
          key={record.id}
          href={`${basePath}/${record.id}`}
          className="flex flex-col gap-1 p-4 hover:bg-muted/50"
        >
          <Text as="span" size={100} weight="medium">{record.title}</Text>
          <Text as="span" size={75} color="subdued" className="line-clamp-1">{record.plainText || "Empty"}</Text>
        </Link>
      ))}
    </div>
  );
}
