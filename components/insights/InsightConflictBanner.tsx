"use client";

import { useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dismissInsightConflict } from "@/actions/insightConflicts";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

const SEVERITY_VARIANT = {
  HIGH: "destructive",
  MEDIUM: "secondary",
  LOW: "outline",
} as const;

export function InsightConflictBanner({
  conflictId,
  severity,
  explanation,
  href,
  sourceTitle,
}: {
  conflictId: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  explanation: string;
  href: string;
  sourceTitle: string;
}) {
  const { canEdit } = useProjectAccess();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-start gap-2 rounded-lg border border-dashed p-3">
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge variant={SEVERITY_VARIANT[severity]}>{severity}</Badge>
          <span className="text-sm font-medium">Possible conflict</span>
        </div>
        <p className="text-sm text-muted-foreground">{explanation}</p>
        <Link href={href} className="line-clamp-1 text-xs text-primary hover:underline">
          {sourceTitle}
        </Link>
      </div>
      {canEdit && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Dismiss conflict"
          disabled={isPending}
          onClick={() => startTransition(() => dismissInsightConflict(conflictId))}
        >
          <X />
        </Button>
      )}
    </div>
  );
}
