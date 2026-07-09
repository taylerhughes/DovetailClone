"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TagBadge } from "@/components/tags/TagBadge";
import type { HighlightEmbedData } from "@/components/editor/HighlightDataContext";

export interface PickableHighlight extends HighlightEmbedData {
  id: string;
}

export function HighlightPickerDialog({
  editor,
  highlights,
  onInsert,
}: {
  editor: Editor;
  highlights: PickableHighlight[];
  onInsert: (highlightId: string, data: HighlightEmbedData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = highlights.filter(
    (h) =>
      h.quote.toLowerCase().includes(query.toLowerCase()) ||
      h.tags.some((t) => t.name.toLowerCase().includes(query.toLowerCase())),
  );

  function handleSelect(highlight: PickableHighlight) {
    editor.chain().focus().insertHighlightEmbed(highlight.id).run();
    onInsert(highlight.id, highlight);
    setOpen(false);
    setQuery("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus data-icon="inline-start" />
        Insert tag
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert tag</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Search tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
          {filtered.length === 0 && (
            <Text size={100} color="subdued" className="p-2">No tags found.</Text>
          )}
          {filtered.map((h) => (
            <button
              key={h.id}
              onClick={() => handleSelect(h)}
              className="flex flex-col gap-1 rounded-md border p-2 text-left hover:bg-muted"
            >
              <Text as="span" size={100} className="line-clamp-2 italic">&ldquo;{h.quote}&rdquo;</Text>
              <div className="flex flex-wrap gap-1">
                {h.tags.map((tag) => (
                  <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>
              <Text as="span" size={75} color="subdued">From: {h.noteTitle}</Text>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
