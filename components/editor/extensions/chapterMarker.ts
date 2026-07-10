import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ChapterMarkerView } from "@/components/editor/ChapterMarkerView";

export const ChapterMarker = Node.create({
  name: "chapterMarker",
  group: "block",
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      title: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-title") ?? "",
        renderHTML: (attrs) => ({ "data-title": attrs.title }),
      },
      startSec: {
        default: null,
        parseHTML: (el) => {
          const v = el.getAttribute("data-start-sec");
          return v === null ? null : Number(v);
        },
        renderHTML: (attrs) => ({ "data-start-sec": attrs.startSec }),
      },
      attachmentId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-attachment-id") ?? null,
        renderHTML: (attrs) => ({ "data-attachment-id": attrs.attachmentId }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-chapter-marker]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-chapter-marker": "" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChapterMarkerView);
  },
});
