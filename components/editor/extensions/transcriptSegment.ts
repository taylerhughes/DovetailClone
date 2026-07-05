import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TranscriptSegmentView } from "@/components/editor/TranscriptSegmentView";

export interface TranscriptSegmentOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    transcriptSegment: {
      insertTranscriptSegment: (attrs: {
        speaker: string;
        startSec: number;
        endSec: number;
        attachmentId: string;
        text: string;
      }) => ReturnType;
    };
  }
}

export const TranscriptSegment = Node.create<TranscriptSegmentOptions>({
  name: "transcriptSegment",
  group: "block",
  content: "inline*",
  defining: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      speaker: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-speaker"),
        renderHTML: (attributes) => ({ "data-speaker": attributes.speaker }),
      },
      startSec: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("data-start-sec");
          return value === null ? null : Number(value);
        },
        renderHTML: (attributes) => ({ "data-start-sec": attributes.startSec }),
      },
      endSec: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("data-end-sec");
          return value === null ? null : Number(value);
        },
        renderHTML: (attributes) => ({ "data-end-sec": attributes.endSec }),
      },
      attachmentId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-attachment-id"),
        renderHTML: (attributes) => ({
          "data-attachment-id": attributes.attachmentId,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-transcript-segment]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-transcript-segment": "",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TranscriptSegmentView);
  },

  addCommands() {
    return {
      insertTranscriptSegment:
        ({ speaker, startSec, endSec, attachmentId, text }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { speaker, startSec, endSec, attachmentId },
            content: text ? [{ type: "text", text }] : [],
          }),
    };
  },
});
