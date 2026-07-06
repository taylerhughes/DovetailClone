import Link from "next/link";

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
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-2">
        {highlights.map((h) => (
          <div key={h.id} className="rounded-md bg-muted/50 p-2 text-sm">
            <p>&ldquo;{h.quote || "(empty)"}&rdquo;</p>
            <Link
              href={`/projects/${projectId}/data/${h.noteId}`}
              className="text-xs text-primary hover:underline"
            >
              {h.noteTitle}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
