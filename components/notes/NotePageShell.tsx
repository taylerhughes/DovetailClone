"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Zap } from "lucide-react";
import { NoteTitle } from "@/components/notes/NoteTitle";
import { NoteActions } from "@/components/notes/NoteActions";
import { Uploader } from "@/components/attachments/Uploader";
import { NoteEditorSection, type NoteEditorSectionHandle } from "@/components/editor/NoteEditorSection";
import { NoteContentTabs } from "@/components/notes/NoteContentTabs";
import { AutoTranscribeController } from "@/components/attachments/AutoTranscribeController";
import { DropZone } from "@/components/attachments/DropZone";
import { StickyHeaderMeasurer } from "@/components/layout/StickyHeaderMeasurer";
import type { JSONContent } from "@tiptap/react";
import type { TagOption } from "@/components/tags/TagPicker";
import type { UploadedAttachment } from "@/lib/uploads/useUpload";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";
import { NoteShareButton } from "@/components/notes/NoteShareButton";
import { cn } from "@/lib/utils";

interface HighlightEntry {
  id: string;
  markId: string | null;
  tagIds: string[];
}

const AUTO_PROCESS_KEY = "auto-process-enabled";

export function NotePageShell({
  noteId,
  initialTitle,
  aiEnabled,
  transcriptionEnabled,
  hasAttachments,
  shareLinkEnabled,
  shareLinkToken,
  editorProps,
  tagsContent,
  children,
}: {
  noteId: string;
  initialTitle: string;
  aiEnabled: boolean;
  transcriptionEnabled: boolean;
  hasAttachments: boolean;
  shareLinkEnabled: boolean;
  shareLinkToken: string | null;
  editorProps: {
    projectId: string;
    initialContent: JSONContent;
    speakerMaps?: Map<string, Map<string, string>>;
    rawSpeakerMaps?: Map<string, Record<string, string>>;
    teamMembers?: { id: string; name: string }[];
    allTags: TagOption[];
    highlights: HighlightEntry[];
  };
  tagsContent: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { canEdit } = useProjectAccess();
  const editorRef = useRef<NoteEditorSectionHandle>(null);
  const [autoProcess, setAutoProcess] = useState(true);
  const [hasAttachmentsState, setHasAttachmentsState] = useState(hasAttachments);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  // Read preference from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTO_PROCESS_KEY);
      if (stored !== null) setAutoProcess(stored !== "false");
    } catch { /* ignore */ }
  }, []);

  function toggleAutoProcess() {
    setAutoProcess((prev) => {
      const next = !prev;
      try { localStorage.setItem(AUTO_PROCESS_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function handleUploaded(attachments: UploadedAttachment[]) {
    setHasAttachmentsState(true);
    if (!autoProcess || !transcriptionEnabled) return;
    const mediaIds = attachments
      .filter((a) => a.kind === "VIDEO" || a.kind === "AUDIO")
      .map((a) => a.id);
    if (mediaIds.length > 0) setPendingIds((prev) => [...prev, ...mediaIds]);
  }

  const canAutoProcess = transcriptionEnabled;

  return (
    <>
      <StickyHeaderMeasurer
        variable="--note-title-height"
        className="sticky z-20 border-b bg-background"
        style={{ top: "3.5rem" } as React.CSSProperties}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-8 py-3">
          <Link
            href={`/projects/${editorProps.projectId}/data`}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div className="flex-1">
            <NoteTitle noteId={noteId} initialTitle={initialTitle} />
          </div>
          {canAutoProcess && (
            <button
              type="button"
              onClick={toggleAutoProcess}
              title={autoProcess ? "Auto-transcribe & summarise on (click to disable)" : "Auto-transcribe & summarise off (click to enable)"}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                autoProcess
                  ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <Zap className="size-3" />
              Auto
            </button>
          )}
          <Uploader noteId={noteId} onUploaded={handleUploaded} />
          {canEdit && (
            <NoteShareButton
              noteId={noteId}
              shareLinkEnabled={shareLinkEnabled}
              shareLinkToken={shareLinkToken}
            />
          )}
          <NoteActions
            noteId={noteId}
            aiEnabled={aiEnabled}
            onSummarize={() => editorRef.current?.summarize() ?? Promise.resolve()}
          />
        </div>
      </StickyHeaderMeasurer>

      {canAutoProcess && (
        <AutoTranscribeController
          noteId={noteId}
          autoSummarize={aiEnabled && autoProcess}
          onSummarize={() => editorRef.current?.summarize() ?? Promise.resolve()}
          pendingAttachmentIds={pendingIds}
          onClearPending={() => setPendingIds([])}
        />
      )}

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-8">
        {!hasAttachmentsState && (
          <DropZone noteId={noteId} onUploaded={handleUploaded} />
        )}
        {children}

        <NoteContentTabs
          transcriptContent={
            <NoteEditorSection
              ref={editorRef}
              noteId={noteId}
              projectId={editorProps.projectId}
              initialContent={editorProps.initialContent}
              speakerMaps={editorProps.speakerMaps}
              rawSpeakerMaps={editorProps.rawSpeakerMaps}
              teamMembers={editorProps.teamMembers}
              allTags={editorProps.allTags}
              highlights={editorProps.highlights}
              aiEnabled={aiEnabled}
            />
          }
          tagsContent={tagsContent}
        />
      </div>
    </>
  );
}
