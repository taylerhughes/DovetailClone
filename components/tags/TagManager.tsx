"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagBadge } from "./TagBadge";
import { TAG_COLORS } from "@/lib/palette";
import { createTag, deleteTag, recolorTag, renameTag } from "@/actions/tags";

type Tag = { id: string; name: string; color: string };

export function TagManager({
  projectId,
  initialTags,
}: {
  projectId: string;
  initialTags: Tag[];
}) {
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex gap-2"
        action={() => {
          if (!newName.trim()) return;
          startTransition(async () => {
            await createTag(projectId, newName);
            setNewName("");
            router.refresh();
          });
        }}
      >
        <Input
          placeholder="New tag name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" disabled={isPending || !newName.trim()}>
          <Plus data-icon="inline-start" />
          Add tag
        </Button>
      </form>

      {initialTags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tags yet. Tags help you find patterns across highlights.
        </p>
      ) : (
        <div className="flex flex-col divide-y rounded-lg border">
          {initialTags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 p-3"
            >
              <div className="flex gap-1">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    aria-label={`Set color ${color}`}
                    className="size-4 rounded-full ring-offset-1 hover:ring-2"
                    style={{
                      backgroundColor: color,
                      outline: tag.color === color ? `2px solid ${color}` : undefined,
                      outlineOffset: 1,
                    }}
                    onClick={() =>
                      startTransition(async () => {
                        await recolorTag(tag.id, color);
                        router.refresh();
                      })
                    }
                  />
                ))}
              </div>
              <Input
                defaultValue={tag.name}
                className="h-7 max-w-48"
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== tag.name) {
                    startTransition(async () => {
                      await renameTag(tag.id, e.target.value);
                      router.refresh();
                    });
                  }
                }}
              />
              <TagBadge name={tag.name} color={tag.color} />
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Delete tag"
                className="ml-auto"
                onClick={() =>
                  startTransition(async () => {
                    await deleteTag(tag.id);
                    router.refresh();
                  })
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
