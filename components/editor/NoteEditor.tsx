"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateNoteContent } from "@/actions/notes";
import { createHighlight } from "@/actions/highlights";
import { HighlightMark } from "@/components/editor/extensions/highlightMark";
import { TranscriptSegment } from "@/components/editor/extensions/transcriptSegment";
import { SpeakerMapContext } from "@/components/editor/SpeakerMapContext";
import { findTranscriptClipRange } from "@/lib/editor/transcriptRange";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { InlineHighlightTagPopover } from "@/components/highlights/InlineHighlightTagPopover";
import type { TagOption } from "@/components/tags/TagPicker";

const AUTOSAVE_DELAY_MS = 800;

export function NoteEditor({
  noteId,
  projectId,
  initialContent,
  speakerMaps,
  allTags,
  highlights,
}: {
  noteId: string;
  projectId: string;
  initialContent: JSONContent;
  speakerMaps?: Map<string, Map<string, string>>;
  allTags: TagOption[];
  highlights: { id: string; markId: string | null; tagIds: string[] }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"saved" | "saving" | "idle">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<{
    markId: string;
    anchor: HTMLElement;
  } | null>(null);

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
      handleDOMEvents: {
        click: (_view, event) => {
          const target = event.target as HTMLElement | null;
          const mark = target?.closest<HTMLElement>("mark[data-highlight-id]");
          if (mark) {
            setActiveHighlight({
              markId: mark.dataset.highlightId!,
              anchor: mark,
            });
          } else {
            setActiveHighlight(null);
          }
          return false;
        },
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
    const markId = crypto.randomUUID();
    const clip = findTranscriptClipRange(editor.state.doc, from, to);

    editor.chain().focus().setHighlightMark(markId).setTextSelection(to).run();
    await saveNow(editor.getJSON());
    await createHighlight(
      noteId,
      markId,
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

    const anchor = editor.view.dom.querySelector<HTMLElement>(
      `mark[data-highlight-id="${CSS.escape(markId)}"]`,
    );
    if (anchor) setActiveHighlight({ markId, anchor });
  }

  const activeHighlightRecord = activeHighlight
    ? highlights.find((h) => h.markId === activeHighlight.markId)
    : undefined;

  if (!editor) return null;

  return (
    <SpeakerMapContext.Provider value={speakerMaps ?? new Map()}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <EditorToolbar editor={editor} showHighlightButton={false} />
          <span className="text-xs text-muted-foreground">
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
          </span>
        </div>
        <BubbleMenu editor={editor} className="flex rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <Button type="button" variant="ghost" size="sm" onClick={handleAddHighlight}>
            <Highlighter data-icon="inline-start" />
            Highlight
          </Button>
        </BubbleMenu>
        <EditorContent editor={editor} />
        {activeHighlight && activeHighlightRecord && (
          <InlineHighlightTagPopover
            projectId={projectId}
            highlightId={activeHighlightRecord.id}
            anchor={activeHighlight.anchor}
            tagIds={activeHighlightRecord.tagIds}
            allTags={allTags}
            onClose={() => setActiveHighlight(null)}
          />
        )}
      </div>
    </SpeakerMapContext.Provider>
  );
}
