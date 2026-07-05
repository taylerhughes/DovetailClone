"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { updateInsightContent } from "@/actions/insights";
import { HighlightEmbed } from "@/components/editor/extensions/highlightEmbed";
import {
  HighlightDataContext,
  type HighlightEmbedData,
} from "@/components/editor/HighlightDataContext";
import {
  HighlightPickerDialog,
  type PickableHighlight,
} from "@/components/editor/HighlightPickerDialog";
import { EditorToolbar } from "@/components/editor/EditorToolbar";

const AUTOSAVE_DELAY_MS = 800;

export function InsightEditor({
  insightId,
  initialContent,
  initialHighlightsById,
  availableHighlights,
}: {
  insightId: string;
  initialContent: JSONContent;
  initialHighlightsById: Map<string, HighlightEmbedData>;
  availableHighlights: PickableHighlight[];
}) {
  const [status, setStatus] = useState<"saved" | "saving" | "idle">("saved");
  const [highlightsById, setHighlightsById] = useState(initialHighlightsById);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = useCallback(
    async (doc: JSONContent) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setStatus("saving");
      await updateInsightContent(insightId, JSON.parse(JSON.stringify(doc)));
      setStatus("saved");
    },
    [insightId],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Write up your findings…" }),
      HighlightEmbed,
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

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <HighlightDataContext.Provider value={highlightsById}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EditorToolbar editor={editor} showHighlightButton={false} />
            <HighlightPickerDialog
              editor={editor}
              highlights={availableHighlights}
              onInsert={(id, data) => {
                setHighlightsById((prev) => new Map(prev).set(id, data));
                void saveNow(editor.getJSON());
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
          </span>
        </div>
        <EditorContent editor={editor} />
      </div>
    </HighlightDataContext.Provider>
  );
}
