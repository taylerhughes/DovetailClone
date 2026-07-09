"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addHighlightTag, deleteHighlight } from "@/actions/highlights";
import { NoteEditor, type NoteEditorHandle } from "@/components/editor/NoteEditor";
import { TranscriptTagSidebar } from "@/components/highlights/TranscriptTagSidebar";
import { AiSuggestedTagsOverlay, type SuggestedTagAssignment } from "@/components/ai/AiSuggestedTagsOverlay";
import type { JSONContent } from "@tiptap/react";
import type { TagOption } from "@/components/tags/TagPicker";

export type NoteEditorSectionHandle = {
  summarize: () => Promise<void>;
};

interface HighlightEntry {
  id: string;
  markId: string | null;
  tagIds: string[];
}

export const NoteEditorSection = forwardRef<NoteEditorSectionHandle, {
  noteId: string;
  projectId: string;
  initialContent: JSONContent;
  speakerMaps?: Map<string, Map<string, string>>;
  allTags: TagOption[];
  highlights: HighlightEntry[];
  aiEnabled: boolean;
}>(function NoteEditorSection({
  noteId,
  projectId,
  initialContent,
  speakerMaps,
  allTags,
  highlights,
  // aiEnabled kept for future use (e.g. gating tag suggestions)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  aiEnabled: _aiEnabled,
}, ref) {
  const [loading, setLoading] = useState(false);
  const [suggestedTagAssignments, setSuggestedTagAssignments] = useState<SuggestedTagAssignment[]>([]);
  const router = useRouter();
  const editorRef = useRef<NoteEditorHandle>(null);

  const storageKey = `ai-tag-suggestions:${noteId}`;

  // Restore suggestions from localStorage on mount (survives page refresh)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setSuggestedTagAssignments(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
  }, [storageKey]);

  function persist(assignments: SuggestedTagAssignment[]) {
    setSuggestedTagAssignments(assignments);
    try {
      if (assignments.length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(assignments));
      }
    } catch {
      // ignore storage errors (private browsing, quota)
    }
  }

  async function handleSummarize() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/summarize-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "AI summarization failed");
        return;
      }
      if (Array.isArray(data.suggestedTagAssignments)) {
        persist(data.suggestedTagAssignments);
      }
      toast.success("Summary added to note");
      router.refresh();
    } catch {
      toast.error("AI summarization failed");
    } finally {
      setLoading(false);
    }
  }

  // Expose summarize to parent via ref
  useImperativeHandle(ref, () => ({ summarize: handleSummarize }));

  function handleAccept(markId: string, tagId: string) {
    const assignment = suggestedTagAssignments.find((a) => a.markId === markId);
    if (!assignment) return;
    const tag = assignment.tags.find((t) => t.id === tagId);
    void (async () => {
      await addHighlightTag(assignment.highlightId, tagId);
      // Confirm the mark (updates color + clears ai flag) and flush-saves to
      // the server before refresh so the server snapshot carries the new attrs.
      if (tag) await editorRef.current?.confirmHighlight(markId, tag.color);
      const next = suggestedTagAssignments
        .map((a) =>
          a.markId === markId
            ? { ...a, tags: a.tags.filter((t) => t.id !== tagId) }
            : a,
        )
        .filter((a) => a.tags.length > 0);
      persist(next);
      router.refresh();
    })();
  }

  function handleReject(markId: string, tagId: string) {
    const assignment = suggestedTagAssignments.find((a) => a.markId === markId);

    const remainingProvisional = assignment?.tags.filter((t) => t.id !== tagId) ?? [];
    const next = suggestedTagAssignments
      .map((a) =>
        a.markId === markId ? { ...a, tags: remainingProvisional } : a,
      )
      .filter((a) => a.tags.length > 0);
    persist(next);

    // Only delete the highlight if no provisional tags remain AND no accepted
    // (DB-persisted) tags exist for it. If the user already accepted one tag
    // for this highlight, rejecting a second should just dismiss the badge.
    if (assignment && remainingProvisional.length === 0) {
      const acceptedTagIds = highlights.find((h) => h.id === assignment.highlightId)?.tagIds ?? [];
      if (acceptedTagIds.length === 0) {
        void deleteHighlight(assignment.highlightId).then(() => router.refresh());
      }
    }
  }

  // Build a map of provisional AI tag IDs per highlight (not yet in the DB).
  const provisionalTagIdsByHighlightId = new Map<string, string[]>();
  for (const a of suggestedTagAssignments) {
    provisionalTagIdsByHighlightId.set(a.highlightId, a.tags.map((t) => t.id));
  }
  // Merge provisional IDs into tagIds so the popover shows them, but also
  // carry them separately so the popover can render them with the AI pill style.
  const mergedHighlights = highlights.map((h) => {
    const provisional = provisionalTagIdsByHighlightId.get(h.id) ?? [];
    if (provisional.length === 0) return h;
    const merged = [...new Set([...h.tagIds, ...provisional])];
    return { ...h, tagIds: merged, provisionalTagIds: provisional };
  });

  return (
    <>
      <div className="grid grid-cols-[1fr_min(700px,100%)_200px] items-start -mx-4 sm:-mx-6 lg:-mx-8">
        <div />
        <div className="px-4 sm:px-6 lg:px-8">
          <NoteEditor
            noteId={noteId}
            projectId={projectId}
            initialContent={initialContent}
            speakerMaps={speakerMaps}
            allTags={allTags}
            highlights={mergedHighlights}
            editorRef={editorRef}
          />
        </div>
        <div className="relative hidden md:block">
          <TranscriptTagSidebar highlights={highlights} allTags={allTags} />
          <AiSuggestedTagsOverlay
            suggestedTagAssignments={suggestedTagAssignments}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        </div>
      </div>
    </>
  );
});
