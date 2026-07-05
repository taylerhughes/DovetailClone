"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { updateNoteContent } from "@/actions/notes";

const AUTOSAVE_DELAY_MS = 800;

export function NoteEditor({
  noteId,
  initialContent,
}: {
  noteId: string;
  initialContent: JSONContent;
}) {
  const [status, setStatus] = useState<"saved" | "saving" | "idle">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Write or paste your notes…" }),
      Link.configure({ openOnClick: false }),
      Underline,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60vh]",
      },
    },
    onUpdate: ({ editor }) => {
      setStatus("idle");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setStatus("saving");
        await updateNoteContent(noteId, editor.getJSON());
        setStatus("saved");
      }, AUTOSAVE_DELAY_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-right text-xs text-muted-foreground">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
