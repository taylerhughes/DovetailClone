import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ProjectCard({
  id,
  name,
  description,
  noteCount,
  insightCount,
}: {
  id: string;
  name: string;
  description: string | null;
  noteCount: number;
  insightCount: number;
}) {
  return (
    <Link href={`/projects/${id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {description || "No description"}
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 text-xs text-muted-foreground">
          {noteCount} {noteCount === 1 ? "note" : "notes"} · {insightCount}{" "}
          {insightCount === 1 ? "insight" : "insights"}
        </div>
      </Card>
    </Link>
  );
}
