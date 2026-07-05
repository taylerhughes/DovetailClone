"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useEditor,
  useEditorState,
  EditorContent,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { updateNoteContent } from "@/actions/notes";
import { createHighlight } from "@/actions/highlights";
import { HighlightMark } from "@/components/editor/extensions/highlightMark";
import { TranscriptSegment } from "@/components/editor/extensions/transcriptSegment";
import { SpeakerMapContext } from "@/components/editor/SpeakerMapContext";
import { findTranscriptClipRange } from "@/lib/editor/transcriptRange";
import { EditorToolbar } from "@/components/editor/EditorToolbar";

const AUTOSAVE_DELAY_MS = 800;

export function NoteEditor({
  noteId,
  initialContent,
  speakerMaps,
}: {
  noteId: string;
  initialContent: JSONContent;
  speakerMaps?: Map<string, Map<string, string>>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"saved" | "saving" | "idle">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = useCallback(
    async (doc: JSONContent) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setStatus("saving");
      // Tiptap/ProseMirror's getJSON() output is textually identical to plain
      // JSON but its nested mark/attrs objects aren't always plain-prototype
      // objects, which breaks React Server Actions' argument serialization.
      // Round-tripping through JSON forces a genuinely plain deep clone.
      await updateNoteContent(noteId, JSON.parse(JSON.stringify(doc)));
      setStatus("saved");
    },
    [noteId],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      Placeholder.configure({ placeholder: "Write or paste your notes…" }),
      HighlightMark,
      TranscriptSegment,
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
      saveTimer.current = setTimeout(() => {
        void saveNow(editor.getJSON());
      }, AUTOSAVE_DELAY_MS);
    },
  });

  const { canHighlight } = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canHighlight: !!editor && !editor.state.selection.empty,
    }),
  }) ?? { canHighlight: false };

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // useEditor only uses `initialContent` at creation time — it never re-syncs
  // when the prop changes on a later render. A background transcription job
  // finishing and calling router.refresh() is exactly that case: the server
  // re-renders with new note.content, but without this effect the already-
  // mounted editor would keep showing the stale pre-transcript document.
  // Skip the sync while the editor has focus so it doesn't clobber whatever
  // the user is actively typing.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(initialContent);
    if (current !== next) {
      editor.commands.setContent(initialContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, initialContent]);

  async function handleAddHighlight() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const quote = editor.state.doc.textBetween(from, to, " ");
    const highlightId = crypto.randomUUID();
    const clip = findTranscriptClipRange(editor.state.doc, from, to);

    editor.chain().focus().setHighlightMark(highlightId).run();
    await saveNow(editor.getJSON());
    await createHighlight(
      noteId,
      highlightId,
      quote,
      clip
        ? {
            attachmentId: clip.attachmentId,
            clipStartSec: clip.startSec,
            clipEndSec: clip.endSec,
          }
        : undefined,
    );
    router.refresh();
  }

  if (!editor) return null;

  return (
    <SpeakerMapContext.Provider value={speakerMaps ?? new Map()}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <EditorToolbar
            editor={editor}
            canHighlight={canHighlight}
            onAddHighlight={handleAddHighlight}
          />
          <span className="text-xs text-muted-foreground">
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
          </span>
        </div>
        <EditorContent editor={editor} />
      </div>
    </SpeakerMapContext.Provider>
  );
}
