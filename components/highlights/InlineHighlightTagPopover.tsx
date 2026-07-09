"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Text } from "@/components/ui/text";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { TagPicker, type TagOption } from "@/components/tags/TagPicker";
import { addHighlightTag, removeHighlightTag, deleteHighlight } from "@/actions/highlights";
import { createTag } from "@/actions/tags";

export function InlineHighlightTagPopover({
  projectId,
  highlightId,
  anchor,
  tagIds,
  provisionalTagIds = [],
  allTags,
  onClose,
}: {
  projectId: string;
  highlightId: string;
  anchor: HTMLElement;
  tagIds: string[];
  provisionalTagIds?: string[];
  allTags: TagOption[];
  onClose: () => void;
}) {
  const router = useRouter();

  const provisionalSet = new Set(provisionalTagIds);
  const provisionalTags = allTags.filter((t) => provisionalSet.has(t.id));
  // Only accepted (DB-persisted) tags go into TagPicker's assignedTagIds
  const acceptedTagIds = tagIds.filter((id) => !provisionalSet.has(id));

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverContent
        anchor={anchor}
        align="start"
        side="top"
        className="w-64 p-2.5"
      >
        <Text size={75} weight="medium" color="subdued" className="mb-1.5">Tag this</Text>

        {/* AI-provisional tags — shown with the sparkle pill, not as accepted tags */}
        {provisionalTags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {provisionalTags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-1.5 rounded-[99px] px-2 py-1 opacity-70"
                style={{ backgroundColor: tag.color }}
                title="AI suggested — accept or reject from the sidebar"
              >
                <Sparkles className="size-3 text-black" />
                <span className="font-['Satoshi'] text-xs font-bold text-black">{tag.name}</span>
              </div>
            ))}
          </div>
        )}

        <TagPicker
          allTags={allTags}
          assignedTagIds={acceptedTagIds}
          projectId={projectId}
          onAssign={async (tagId) => {
            await addHighlightTag(highlightId, tagId);
            router.refresh();
          }}
          onUnassign={async (tagId) => {
            const remainingCount = acceptedTagIds.filter((id) => id !== tagId).length;
            await removeHighlightTag(highlightId, tagId);
            if (remainingCount === 0) {
              await deleteHighlight(highlightId);
              onClose();
            }
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
