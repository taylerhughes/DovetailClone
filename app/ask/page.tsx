import { requireUser } from "@/lib/auth/session";
import { isAiEnabled } from "@/lib/ai/client";
import { isEmbeddingsEnabled } from "@/lib/embeddings/client";
import { AskResearchChat } from "@/components/ai/AskResearchChat";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default async function AskPage() {
  await requireUser();

  if (!isAiEnabled() || !isEmbeddingsEnabled()) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <Text size={100} weight="medium">Ask your research is disabled</Text>
        <Text size={100} color="subdued">
          Set both <code>ANTHROPIC_API_KEY</code> and <code>VOYAGE_API_KEY</code> to enable this feature.
        </Text>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <Heading level={1} size={700}>Ask your research</Heading>
      <AskResearchChat />
    </main>
  );
}
