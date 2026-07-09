"use client";

import { useRef } from "react";
import { NoteTitle } from "@/components/notes/NoteTitle";
import { NoteActions } from "@/components/notes/NoteActions";
import { Uploader } from "@/components/attachments/Uploader";
import { NoteEditorSection, type NoteEditorSectionHandle } from "@/components/editor/NoteEditorSection";
import { NoteContentTabs } from "@/components/notes/NoteContentTabs";
import type { JSONContent } from "@tiptap/react";
import type { TagOption } from "@/components/tags/TagPicker";

interface HighlightEntry {
  id: string;
  markId: string | null;
  tagIds: string[];
}

export function NotePageShell({
  noteId,
  initialTitle,
  aiEnabled,
  editorProps,
  tagsContent,
  children,
}: {
  noteId: string;
  initialTitle: string;
  aiEnabled: boolean;
  editorProps: {
    projectId: string;
    initialContent: JSONContent;
    speakerMaps?: Map<string, Map<string, string>>;
    allTags: TagOption[];
    highlights: HighlightEntry[];
  };
  /** The tags list rendered in the Tags tab */
  tagsContent: React.ReactNode;
  /** Server-rendered content between the header and the tabs (fields, drop zone, attachments) */
  children?: React.ReactNode;
}) {
  const editorRef = useRef<NoteEditorSectionHandle>(null);

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <NoteTitle noteId={noteId} initialTitle={initialTitle} />
        </div>
        <Uploader noteId={noteId} />
        <NoteActions
          noteId={noteId}
          aiEnabled={aiEnabled}
          onSummarize={() => editorRef.current?.summarize() ?? Promise.resolve()}
        />
      </div>

      {/* Fields, drop zone, attachments (server-rendered) */}
      {children}

      {/* Transcript / Tags tabs */}
      <NoteContentTabs
        transcriptContent={
          <NoteEditorSection
            ref={editorRef}
            noteId={noteId}
            projectId={editorProps.projectId}
            initialContent={editorProps.initialContent}
            speakerMaps={editorProps.speakerMaps}
            allTags={editorProps.allTags}
            highlights={editorProps.highlights}
            aiEnabled={aiEnabled}
          />
        }
        tagsContent={tagsContent}
      />
    </>
  );
}
