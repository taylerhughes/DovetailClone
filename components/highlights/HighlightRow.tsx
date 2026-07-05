"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
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
        <p className="text-sm">
          {highlight.wholeNote && (
            <span className="mr-1.5 text-xs font-medium text-muted-foreground">
              Whole note ·
            </span>
          )}
          &ldquo;{highlight.quote || "(empty)"}&rdquo;
          {highlight.orphaned && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              (removed from note)
            </span>
          )}
        </p>
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
          className="text-xs text-primary hover:underline"
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
