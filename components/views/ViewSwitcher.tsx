"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createView, deleteView } from "@/actions/views";
import type {
  ViewEntityType,
  ViewLayout,
} from "@/lib/generated/prisma/client";

const LAYOUT_LABELS: Record<ViewLayout, string> = {
  GRID: "Grid",
  BOARD: "Board",
  TABLE: "Table",
  CANVAS: "Canvas",
  LIST: "List",
};

export function ViewSwitcher({
  basePath,
  projectId,
  entityType,
  views,
  activeViewId,
  availableLayouts = ["GRID", "LIST", "BOARD", "TABLE"],
}: {
  basePath: string;
  projectId: string;
  entityType: ViewEntityType;
  views: { id: string; name: string; layout: ViewLayout }[];
  activeViewId: string | null;
  availableLayouts?: ViewLayout[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [layout, setLayout] = useState<ViewLayout>(availableLayouts[0]);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {views.map((view) => (
        <div key={view.id} className="group relative flex items-center">
          <Link
            href={`${basePath}?view=${view.id}`}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm whitespace-nowrap",
              activeViewId === view.id
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {view.name}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {LAYOUT_LABELS[view.layout]}
            </span>
          </Link>
          <button
            aria-label={`Delete view ${view.name}`}
            className="hidden pr-1 text-muted-foreground hover:text-destructive group-hover:block"
            onClick={() =>
              startTransition(async () => {
                await deleteView(view.id);
                router.push(basePath);
              })
            }
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="New view" />}>
          <Plus />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New view</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="View name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Select value={layout} onValueChange={(v) => setLayout(v as ViewLayout)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: ViewLayout) => LAYOUT_LABELS[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableLayouts.map((l) => (
                  <SelectItem key={l} value={l}>
                    {LAYOUT_LABELS[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              disabled={isPending || !name.trim()}
              onClick={() =>
                startTransition(async () => {
                  const view = await createView(projectId, entityType, layout, name);
                  setOpen(false);
                  setName("");
                  router.push(`${basePath}?view=${view.id}`);
                })
              }
            >
              Create view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
