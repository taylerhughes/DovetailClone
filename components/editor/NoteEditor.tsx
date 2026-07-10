"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { updateNoteContent } from "@/actions/notes";
import { createHighlight } from "@/actions/highlights";
import { HighlightMark } from "@/components/editor/extensions/highlightMark";
import { TranscriptSegment } from "@/components/editor/extensions/transcriptSegment";
import { CitationNode } from "@/components/editor/extensions/citationMark";
import { ChapterMarker } from "@/components/editor/extensions/chapterMarker";
import { SpeakerMapContext } from "@/components/editor/SpeakerMapContext";
import { findTranscriptClipRange } from "@/lib/editor/transcriptRange";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { InlineHighlightTagPopover } from "@/components/highlights/InlineHighlightTagPopover";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";
import type { TagOption } from "@/components/tags/TagPicker";

const AUTOSAVE_DELAY_MS = 800;

export interface NoteEditorHandle {
  confirmHighlight: (markId: string, color: string) => Promise<void>;
}

export function NoteEditor({
  noteId,
  projectId,
  initialContent,
  speakerMaps,
  rawSpeakerMaps,
  teamMembers,
  allTags,
  highlights,
  editorRef,
}: {
  noteId: string;
  projectId: string;
  initialContent: JSONContent;
  speakerMaps?: Map<string, Map<string, string>>;
  rawSpeakerMaps?: Map<string, Record<string, string>>;
  teamMembers?: { id: string; name: string }[];
  allTags: TagOption[];
  highlights: { id: string; markId: string | null; tagIds: string[]; provisionalTagIds?: string[] }[];
  editorRef?: Ref<NoteEditorHandle>;
}) {
  const router = useRouter();
  const { canEdit } = useProjectAccess();
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
    editable: canEdit,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      Placeholder.configure({ placeholder: "Write or paste your notes…" }),
      HighlightMark,
      TranscriptSegment,
      CitationNode,
      ChapterMarker,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60vh]",
      },
      handleDOMEvents: {
        click: (_view, event) => {
          if (!canEdit) return false;
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

  useImperativeHandle(editorRef, () => ({
    confirmHighlight: async (markId: string, color: string) => {
      if (!editor) return;
      editor.commands.confirmHighlightMark(markId, color);
      // Flush the save immediately so the server has the updated mark attrs
      // (color, ai:false) before router.refresh() overwrites the editor content
      // with the stale server snapshot.
      if (saveTimer.current) clearTimeout(saveTimer.current);
      await saveNow(editor.getJSON());
    },
  }));

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [editor, canEdit]);

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
      // Defer to avoid calling setContent (which triggers flushSync) while
      // React is already rendering — happens when router.refresh() causes a
      // re-render and this effect fires synchronously inside it.
      setTimeout(() => {
        if (!editor.isFocused) editor.commands.setContent(initialContent);
      }, 0);
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
    <SpeakerMapContext.Provider value={{
      speakerMaps: speakerMaps ?? new Map(),
      rawSpeakerMaps: rawSpeakerMaps ?? new Map(),
      teamMembers: teamMembers ?? [],
    }}>
      <div className="flex flex-col gap-2">
        {canEdit && (
          <div
            className="sticky z-10 flex items-center justify-between gap-2 bg-background pb-2 pt-2"
            style={{ top: "calc(3.5rem + var(--note-title-height, 48px))" }}
          >
            <EditorToolbar editor={editor} showHighlightButton={false} />
            <Text as="span" size={75} color="subdued" className="shrink-0">
              {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
            </Text>
          </div>
        )}
        {canEdit && (
          <BubbleMenu editor={editor} className="flex rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <Button type="button" variant="ghost" size="sm" onClick={handleAddHighlight}>
              <Highlighter data-icon="inline-start" />
              Tag
            </Button>
          </BubbleMenu>
        )}
        <EditorContent editor={editor} />
        {canEdit && activeHighlight && activeHighlightRecord && (
          <InlineHighlightTagPopover
            projectId={projectId}
            highlightId={activeHighlightRecord.id}
            anchor={activeHighlight.anchor}
            tagIds={activeHighlightRecord.tagIds}
            provisionalTagIds={activeHighlightRecord.provisionalTagIds ?? []}
            allTags={allTags}
            onClose={() => setActiveHighlight(null)}
          />
        )}
      </div>
    </SpeakerMapContext.Provider>
  );
}
