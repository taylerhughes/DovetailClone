import { requireUser } from "@/lib/auth/session";
import { isAiEnabled } from "@/lib/ai/client";
import { isEmbeddingsEnabled } from "@/lib/embeddings/client";
import { AskResearchChat } from "@/components/ai/AskResearchChat";

export default async function AskPage() {
  await requireUser();

  if (!isAiEnabled() || !isEmbeddingsEnabled()) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-medium">Ask your research is disabled</p>
        <p className="text-sm text-muted-foreground">
          Set both <code>ANTHROPIC_API_KEY</code> and <code>VOYAGE_API_KEY</code> to
          enable this feature.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold tracking-tight">Ask your research</h1>
      <AskResearchChat />
    </main>
  );
}
