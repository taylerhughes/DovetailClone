import { db } from "@/lib/db";
import { isAiEnabled } from "@/lib/ai/client";
import { Text } from "@/components/ui/text";
import { ThemeCard } from "@/components/themes/ThemeCard";
import { RegenerateThemesButton } from "@/components/themes/RegenerateThemesButton";

export default async function ThemesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const themes = await db.theme.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: {
      highlightLinks: {
        include: {
          highlight: { include: { note: { select: { id: true, title: true } } } },
        },
      },
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Text size={100} color="subdued">AI-generated groupings of this project&apos;s highlights, distinct from tags.</Text>
        {isAiEnabled() && (
          <RegenerateThemesButton
            projectId={projectId}
            hasExistingThemes={themes.length > 0}
          />
        )}
      </div>

      {themes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
          <Text size={100} weight="medium">No themes yet</Text>
          <Text size={100} color="subdued">
            {isAiEnabled()
              ? "Click Regenerate themes to cluster this project's highlights into synthesized themes."
              : "AI features are disabled — set ANTHROPIC_API_KEY to enable theme clustering."}
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              projectId={projectId}
              title={theme.title}
              description={theme.description}
              highlights={theme.highlightLinks.map((link) => ({
                id: link.highlight.id,
                quote: link.highlight.quote,
                noteId: link.highlight.note.id,
                noteTitle: link.highlight.note.title,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
