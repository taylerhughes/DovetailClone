"use client";

import type { Editor } from "@tiptap/react";
import { Bold, Italic, Underline as UnderlineIcon, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EditorToolbar({
  editor,
  onAddHighlight,
  canHighlight,
  showHighlightButton = true,
}: {
  editor: Editor;
  onAddHighlight?: () => void;
  canHighlight?: boolean;
  showHighlightButton?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 border-b pb-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Bold"
        className={cn(editor.isActive("bold") && "bg-muted text-foreground")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Italic"
        className={cn(editor.isActive("italic") && "bg-muted text-foreground")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Underline"
        className={cn(
          editor.isActive("underline") && "bg-muted text-foreground",
        )}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon />
      </Button>
      {showHighlightButton && (
        <>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canHighlight}
            onClick={onAddHighlight}
          >
            <Highlighter data-icon="inline-start" />
            Highlight
          </Button>
        </>
      )}
    </div>
  );
}
