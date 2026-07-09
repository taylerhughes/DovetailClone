"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { createHighlightReel } from "@/actions/highlightReels";
import { HighlightReelCard } from "@/components/tags/HighlightReelCard";

type Reel = {
  id: string;
  name: string;
  status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
};

export function HighlightReelPanel({
  projectId,
  tagId,
  tagName,
  eligibleCount,
  reels,
}: {
  projectId: string;
  tagId: string;
  tagName: string;
  eligibleCount: number;
  reels: Reel[];
}) {
  const router = useRouter();
  const [name, setName] = useState(`${tagName} reel`);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-64"
          placeholder="Reel name"
        />
        <Button
          disabled={isPending || eligibleCount === 0 || !name.trim()}
          onClick={() =>
            startTransition(async () => {
              await createHighlightReel(projectId, tagId, name);
              router.refresh();
            })
          }
        >
          <Clapperboard data-icon="inline-start" />
          Create reel
        </Button>
      </div>
      {eligibleCount === 0 && (
        <Text size={75} color="subdued">
          No tags under this label have a video/audio clip range yet — tag text inside a transcribed video/audio note to make one reel-eligible.
        </Text>
      )}
      {reels.length > 0 && (
        <div className="flex flex-col gap-2">
          {reels.map((reel) => (
            <HighlightReelCard key={reel.id} reel={reel} />
          ))}
        </div>
      )}
    </div>
  );
}
