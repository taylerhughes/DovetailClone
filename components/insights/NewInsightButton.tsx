"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInsight } from "@/actions/insights";

export function NewInsightButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => createInsight(projectId))}
    >
      <Plus data-icon="inline-start" />
      New insight
    </Button>
  );
}
