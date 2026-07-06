"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagBadge } from "./TagBadge";
import { TAG_COLORS } from "@/lib/palette";
import { createTag, deleteTag, recolorTag, renameTag, setTagParent } from "@/actions/tags";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

type Tag = { id: string; name: string; color: string; parentId: string | null };

const NO_PARENT = "__none__";

export function TagManager({
  projectId,
  initialTags,
}: {
  projectId: string;
  initialTags: Tag[];
}) {
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState(NO_PARENT);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { canEdit } = useProjectAccess();

  const topLevelTags = initialTags.filter((t) => !t.parentId);
  const childrenByParentId = new Map<string, Tag[]>();
  for (const tag of initialTags) {
    if (tag.parentId) {
      childrenByParentId.set(tag.parentId, [
        ...(childrenByParentId.get(tag.parentId) ?? []),
        tag,
      ]);
    }
  }
  const tagsWithChildren = new Set(childrenByParentId.keys());

  function renderTagRow(tag: Tag, indented: boolean) {
    // Only leaf tags (no children of their own) can be nested, so a
    // parent's children can't themselves become parents — keeps nesting to
    // the one level the schema is designed for.
    const canHaveParent = !tagsWithChildren.has(tag.id);

    if (!canEdit) {
      return (
        <div key={tag.id} className={`flex items-center gap-3 p-3 ${indented ? "pl-8" : ""}`}>
          <TagBadge name={tag.name} color={tag.color} />
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="View highlights and reels"
            className="ml-auto"
            render={<Link href={`/projects/${projectId}/tags/${tag.id}`} />}
          >
            <Video />
          </Button>
        </div>
      );
    }

    return (
      <div key={tag.id} className={`flex items-center gap-3 p-3 ${indented ? "pl-8" : ""}`}>
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
        {canHaveParent && (
          <Select
            value={tag.parentId ?? NO_PARENT}
            onValueChange={(v) =>
              startTransition(async () => {
                await setTagParent(tag.id, v === NO_PARENT ? null : (v ?? null));
                router.refresh();
              })
            }
          >
            <SelectTrigger className="h-7 w-40">
              <SelectValue placeholder="No parent">
                {(v: string) =>
                  v === NO_PARENT
                    ? "No parent"
                    : (topLevelTags.find((t) => t.id === v)?.name ?? "No parent")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PARENT}>No parent</SelectItem>
              {topLevelTags
                .filter((t) => t.id !== tag.id)
                .map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="View highlights and reels"
          className="ml-auto"
          nativeButton={false}
          render={<Link href={`/projects/${projectId}/tags/${tag.id}`} />}
        >
          <Video />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Delete tag"
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
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <form
          className="flex gap-2"
          action={() => {
            if (!newName.trim()) return;
            startTransition(async () => {
              await createTag(
                projectId,
                newName,
                newParentId === NO_PARENT ? null : newParentId,
              );
              setNewName("");
              setNewParentId(NO_PARENT);
              router.refresh();
            });
          }}
        >
          <Input
            placeholder="New tag name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Select value={newParentId} onValueChange={(v) => setNewParentId(v ?? NO_PARENT)}>
            <SelectTrigger className="w-44">
              <SelectValue>
                {(v: string) =>
                  v === NO_PARENT
                    ? "No parent"
                    : (topLevelTags.find((t) => t.id === v)?.name ?? "No parent")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PARENT}>No parent</SelectItem>
              {topLevelTags.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={isPending || !newName.trim()}>
            <Plus data-icon="inline-start" />
            Add tag
          </Button>
        </form>
      )}

      {initialTags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tags yet. Tags help you find patterns across highlights.
        </p>
      ) : (
        <div className="flex flex-col divide-y rounded-lg border">
          {topLevelTags.map((tag) => (
            <div key={tag.id} className="flex flex-col divide-y">
              {renderTagRow(tag, false)}
              {(childrenByParentId.get(tag.id) ?? []).map((child) =>
                renderTagRow(child, true),
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
