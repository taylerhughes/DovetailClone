"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { TagPicker, type TagOption } from "@/components/tags/TagPicker";
import { SuggestTagsButton } from "@/components/ai/SuggestTagsButton";
import { addHighlightTag, removeHighlightTag, deleteHighlight } from "@/actions/highlights";
import { createTag } from "@/actions/tags";

export function HighlightRow({
  projectId,
  highlight,
  allTags,
  showSourceLink = false,
  aiEnabled = false,
}: {
  projectId: string;
  highlight: {
    id: string;
    quote: string;
    wholeNote: boolean;
    orphaned: boolean;
    noteId: string;
    noteTitle?: string;
    tagIds: string[];
  };
  allTags: TagOption[];
  showSourceLink?: boolean;
  aiEnabled?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <Text size={100}>
          {highlight.wholeNote && (
            <Text as="span" size={75} weight="medium" color="subdued" className="mr-1.5">Whole note ·</Text>
          )}
          &ldquo;{highlight.quote || "(empty)"}&rdquo;
          {highlight.orphaned && (
            <Text as="span" size={75} color="subdued" className="ml-1.5">(removed from note)</Text>
          )}
        </Text>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Delete highlight"
          onClick={() =>
            deleteHighlight(highlight.id).then(() => router.refresh())
          }
        >
          <Trash2 />
        </Button>
      </div>

      {showSourceLink && (
        <Link
          href={`/projects/${projectId}/data/${highlight.noteId}`}
          className="text-fs-75 leading-type-snug font-type-body text-primary hover:underline"
        >
          {highlight.noteTitle}
        </Link>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <TagPicker
          allTags={allTags}
          assignedTagIds={highlight.tagIds}
          onAssign={async (tagId) => {
            await addHighlightTag(highlight.id, tagId);
            router.refresh();
          }}
          onUnassign={async (tagId) => {
            await removeHighlightTag(highlight.id, tagId);
            router.refresh();
          }}
          onCreateTag={async (name) => {
            const tag = await createTag(projectId, name);
            router.refresh();
            return tag.id;
          }}
        />
        {aiEnabled && (
          <SuggestTagsButton
            projectId={projectId}
            text={highlight.quote}
            allTags={allTags}
            assignedTagIds={highlight.tagIds}
            onAccept={(tagId) => {
              void addHighlightTag(highlight.id, tagId).then(() => router.refresh());
            }}
          />
        )}
      </div>
    </div>
  );
}
