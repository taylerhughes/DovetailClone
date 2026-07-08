import Link from "next/link";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type ThemeHighlight = {
  id: string;
  quote: string;
  noteId: string;
  noteTitle: string;
};

export function ThemeCard({
  projectId,
  title,
  description,
  highlights,
}: {
  projectId: string;
  title: string;
  description: string;
  highlights: ThemeHighlight[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <Heading level={3} size={200} weight="medium">{title}</Heading>
        <Text size={100} color="subdued">{description}</Text>
      </div>
      <div className="flex flex-col gap-2">
        {highlights.map((h) => (
          <div key={h.id} className="rounded-md bg-muted/50 p-2">
            <Text size={100}>&ldquo;{h.quote || "(empty)"}&rdquo;</Text>
            <Link href={`/projects/${projectId}/data/${h.noteId}`} className="text-primary hover:underline">
              <Text as="span" size={75}>{h.noteTitle}</Text>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
