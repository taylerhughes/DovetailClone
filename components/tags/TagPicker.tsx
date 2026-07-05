"use client";

import { useMemo, useState, useTransition } from "react";
import { Tag as TagIcon, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TagBadge } from "./TagBadge";
import { cn } from "@/lib/utils";

export type TagOption = {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
};

export function TagPicker({
  allTags,
  assignedTagIds,
  onAssign,
  onUnassign,
  onCreateTag,
}: {
  allTags: TagOption[];
  assignedTagIds: string[];
  onAssign: (tagId: string) => Promise<void> | void;
  onUnassign: (tagId: string) => Promise<void> | void;
  onCreateTag: (name: string) => Promise<string>;
}) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const assigned = allTags.filter((t) => assignedTagIds.includes(t.id));
  const filtered = useMemo(
    () =>
      allTags.filter((t) =>
        t.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [allTags, query],
  );
  const exactMatch = allTags.some(
    (t) => t.name.toLowerCase() === query.trim().toLowerCase(),
  );

  // While browsing (no search query), show tags grouped under their parent
  // with a visual indent; while actively searching, fall back to a flat
  // list so a matching child isn't hidden behind a non-matching parent.
  const isBrowsing = query.trim() === "";
  const orderedWithIndent: { tag: TagOption; indented: boolean }[] = isBrowsing
    ? (() => {
        const topLevel = filtered.filter((t) => !t.parentId);
        const childrenByParentId = new Map<string, TagOption[]>();
        for (const t of filtered) {
          if (t.parentId) {
            childrenByParentId.set(t.parentId, [
              ...(childrenByParentId.get(t.parentId) ?? []),
              t,
            ]);
          }
        }
        return topLevel.flatMap((t) => [
          { tag: t, indented: false },
          ...(childrenByParentId.get(t.id) ?? []).map((child) => ({
            tag: child,
            indented: true,
          })),
        ]);
      })()
    : filtered.map((t) => ({ tag: t, indented: false }));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assigned.map((tag) => (
        <button
          key={tag.id}
          onClick={() => startTransition(() => onUnassign(tag.id))}
          title="Remove tag"
        >
          <TagBadge name={tag.name} color={tag.color} />
        </button>
      ))}

      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon-xs" aria-label="Add tag" />
          }
        >
          <TagIcon />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1.5">
          <Input
            autoFocus
            placeholder="Search or create tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-1.5"
          />
          <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
            {orderedWithIndent.map(({ tag, indented }) => {
              const isAssigned = assignedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() =>
                      isAssigned ? onUnassign(tag.id) : onAssign(tag.id),
                    )
                  }
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted",
                    indented && "ml-4",
                  )}
                >
                  <TagBadge name={tag.name} color={tag.color} />
                  {isAssigned && <Check className="size-3.5" />}
                </button>
              );
            })}
            {query.trim() && !exactMatch && (
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const tagId = await onCreateTag(query.trim());
                    await onAssign(tagId);
                    setQuery("");
                  })
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm hover:bg-muted",
                )}
              >
                <Plus className="size-3.5" />
                Create &ldquo;{query.trim()}&rdquo;
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
