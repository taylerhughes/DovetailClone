"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";

export interface CanvasCardData extends Record<string, unknown> {
  href: string;
  title: string;
  subtitle: string;
  kind: "NOTE" | "HIGHLIGHT" | "INSIGHT";
  onRemove: () => void;
}

export function CanvasCardNode({ data }: NodeProps) {
  const { href, title, subtitle, kind, onRemove } = data as CanvasCardData;

  return (
    <Card className="w-56 cursor-default">
      <CardHeader className="gap-0.5 p-3">
        <div className="flex items-start justify-between gap-1">
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            {kind}
          </span>
          <button
            aria-label="Remove from canvas"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        </div>
        <Link href={href} className="text-sm font-medium hover:underline">
          {title}
        </Link>
        <CardDescription className="line-clamp-3 text-xs">
          {subtitle}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export const canvasNodeTypes = { canvasCard: CanvasCardNode };
