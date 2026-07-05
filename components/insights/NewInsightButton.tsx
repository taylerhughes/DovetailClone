"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInsight } from "@/actions/insights";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

export function NewInsightButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const { canEdit } = useProjectAccess();

  if (!canEdit) return null;

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
