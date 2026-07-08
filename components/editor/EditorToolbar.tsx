"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Code2,
  Link,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/10 hover:text-white",
        active && "bg-white/15 text-white",
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="mx-1 h-4 w-px bg-white/20" />;
}

export function EditorToolbar({
  editor,
  showHighlightButton = true,
  onAddHighlight,
  canHighlight,
}: {
  editor: Editor;
  showHighlightButton?: boolean;
  onAddHighlight?: () => void;
  canHighlight?: boolean;
}) {
  function toggleLink() {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt("URL");
      if (url) editor.chain().focus().setLink({ href: url }).run();
    }
  }

  return (
    <div className="flex w-full items-center gap-0.5 rounded-xl bg-zinc-800 px-2 py-1.5">
      {/* Inline formatting */}
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <Separator />

      {/* Headings */}
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <Separator />

      {/* Highlight */}
      {showHighlightButton && (
        <>
          <ToolbarButton
            label="Highlight"
            active={false}
            onClick={() => onAddHighlight?.()}
          >
            <Highlighter className="size-4" />
          </ToolbarButton>
          <Separator />
        </>
      )}

      {/* Code & Link */}
      <ToolbarButton
        label="Code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Link"
        active={editor.isActive("link")}
        onClick={toggleLink}
      >
        <Link className="size-4" />
      </ToolbarButton>
    </div>
  );
}
