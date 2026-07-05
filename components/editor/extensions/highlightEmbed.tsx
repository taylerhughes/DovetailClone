import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { HighlightEmbedCard } from "@/components/editor/HighlightEmbedCard";

export interface HighlightEmbedOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlightEmbed: {
      insertHighlightEmbed: (highlightId: string) => ReturnType;
    };
  }
}

export const HighlightEmbed = Node.create<HighlightEmbedOptions>({
  name: "highlightEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      highlightId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-highlight-id"),
        renderHTML: (attributes) => ({
          "data-highlight-id": attributes.highlightId,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-highlight-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-highlight-embed": "",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HighlightEmbedCard);
  },

  addCommands() {
    return {
      insertHighlightEmbed:
        (highlightId: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { highlightId },
          }),
    };
  },
});
