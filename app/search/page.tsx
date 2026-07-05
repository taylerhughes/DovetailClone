import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchAll } from "@/lib/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";
  const results = query.trim() ? await searchAll(query) : null;
  const totalCount = results
    ? results.notes.length + results.highlights.length + results.insights.length
    : 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <form className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search notes, highlights, and insights across all projects…"
          className="pl-9"
          autoFocus
        />
      </form>

      {!results ? (
        <p className="text-sm text-muted-foreground">
          Start typing and press Enter to search everything in your workspace.
        </p>
      ) : totalCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          No results for &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {results.notes.length > 0 && (
            <ResultSection title="Notes">
              {results.notes.map((n) => (
                <ResultRow
                  key={n.id}
                  href={`/projects/${n.projectId}/data/${n.id}`}
                  title={n.title}
                  subtitle={n.plainText}
                  projectName={n.projectName}
                />
              ))}
            </ResultSection>
          )}

          {results.highlights.length > 0 && (
            <ResultSection title="Highlights">
              {results.highlights.map((h) => (
                <ResultRow
                  key={h.id}
                  href={`/projects/${h.projectId}/data/${h.noteId}`}
                  title={`"${h.quote}"`}
                  subtitle={`From: ${h.noteTitle}`}
                  projectName={h.projectName}
                />
              ))}
            </ResultSection>
          )}

          {results.insights.length > 0 && (
            <ResultSection title="Insights">
              {results.insights.map((i) => (
                <ResultRow
                  key={i.id}
                  href={`/projects/${i.projectId}/insights/${i.id}`}
                  title={i.title}
                  subtitle={i.plainText}
                  projectName={i.projectName}
                />
              ))}
            </ResultSection>
          )}
        </div>
      )}
    </main>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="flex flex-col divide-y rounded-lg border">{children}</div>
    </div>
  );
}

function ResultRow({
  href,
  title,
  subtitle,
  projectName,
}: {
  href: string;
  title: string;
  subtitle: string;
  projectName: string;
}) {
  return (
    <Link href={href} className="flex flex-col gap-1 p-3 hover:bg-muted/50">
      <div className="flex items-center justify-between gap-2">
        <span className="line-clamp-1 text-sm font-medium">{title}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {projectName}
        </span>
      </div>
      <span className="line-clamp-1 text-xs text-muted-foreground">
        {subtitle || "Empty"}
      </span>
    </Link>
  );
}
