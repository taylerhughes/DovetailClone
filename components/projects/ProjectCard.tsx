import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

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
        <div className="px-6 pb-6">
          <Text as="span" size={75} color="subdued">
            {noteCount} {noteCount === 1 ? "note" : "notes"} · {insightCount}{" "}
            {insightCount === 1 ? "insight" : "insights"}
          </Text>
        </div>
      </Card>
    </Link>
  );
}
