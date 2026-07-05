"use client";

import { useRouter } from "next/navigation";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { TagPicker, type TagOption } from "@/components/tags/TagPicker";
import { addHighlightTag, removeHighlightTag } from "@/actions/highlights";
import { createTag } from "@/actions/tags";

export function InlineHighlightTagPopover({
  projectId,
  highlightId,
  anchor,
  tagIds,
  allTags,
  onClose,
}: {
  projectId: string;
  highlightId: string;
  anchor: HTMLElement;
  tagIds: string[];
  allTags: TagOption[];
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverContent
        anchor={anchor}
        align="start"
        side="top"
        className="w-64 p-2.5"
      >
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Tag this highlight
        </p>
        <TagPicker
          allTags={allTags}
          assignedTagIds={tagIds}
          onAssign={async (tagId) => {
            await addHighlightTag(highlightId, tagId);
            router.refresh();
          }}
          onUnassign={async (tagId) => {
            await removeHighlightTag(highlightId, tagId);
            router.refresh();
          }}
          onCreateTag={async (name) => {
            const tag = await createTag(projectId, name);
            return tag.id;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
