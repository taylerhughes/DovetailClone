import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function NoteCard({
  projectId,
  note,
  compact = false,
}: {
  projectId: string;
  note: { id: string; title: string; plainText: string };
  compact?: boolean;
}) {
  return (
    <Link href={`/projects/${projectId}/data/${note.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className={compact ? "gap-0.5 p-3" : undefined}>
          <CardTitle className={compact ? "text-sm" : undefined}>
            {note.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {note.plainText || "Empty note"}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
