"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addToCanvas } from "@/actions/canvas";
import type { CanvasSubjectType } from "@/lib/generated/prisma/client";

export interface CanvasCandidate {
  id: string;
  kind: CanvasSubjectType;
  title: string;
  subtitle: string;
}

export function AddToCanvasPanel({
  viewId,
  candidates,
}: {
  viewId: string;
  candidates: CanvasCandidate[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = candidates.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus data-icon="inline-start" />
        Add to canvas
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to canvas</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Search notes, highlights, insights…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="p-2 text-sm text-muted-foreground">
              Nothing left to add.
            </p>
          )}
          {filtered.map((c) => (
            <button
              key={`${c.kind}-${c.id}`}
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await addToCanvas(viewId, c.kind, c.id);
                  router.refresh();
                })
              }
              className="flex items-center justify-between rounded-md border p-2 text-left text-sm hover:bg-muted"
            >
              <span className="line-clamp-1">{c.title}</span>
              <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
                {c.kind}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
