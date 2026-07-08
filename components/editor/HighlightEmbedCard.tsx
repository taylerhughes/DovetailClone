"use client";

import { useContext } from "react";
import Link from "next/link";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/tags/TagBadge";
import { HighlightDataContext } from "@/components/editor/HighlightDataContext";
import { Text } from "@/components/ui/text";

export function HighlightEmbedCard({ node, deleteNode, selected }: NodeViewProps) {
  const highlightsById = useContext(HighlightDataContext);
  const highlightId = node.attrs.highlightId as string;
  const data = highlightsById.get(highlightId);

  return (
    <NodeViewWrapper
      className={`my-2 rounded-lg border-l-4 border-primary bg-muted/50 p-3 ${selected ? "ring-2 ring-ring" : ""}`}
      contentEditable={false}
    >
      {!data ? (
        <Text size={75} color="subdued">Highlight not found</Text>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <Text size={100} className="italic">&ldquo;{data.quote || "(empty)"}&rdquo;</Text>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Remove embedded highlight"
              onClick={() => deleteNode()}
            >
              <Trash2 />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {data.tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} />
            ))}
          </div>
          <NoteSourceLink noteId={data.noteId} noteTitle={data.noteTitle} />
        </div>
      )}
    </NodeViewWrapper>
  );
}

function NoteSourceLink({
  noteId,
  noteTitle,
}: {
  noteId: string;
  noteTitle: string;
}) {
  return (
    <Link href={`../data/${noteId}`} className="text-primary hover:underline">
      <Text as="span" size={75}>From: {noteTitle}</Text>
    </Link>
  );
}
