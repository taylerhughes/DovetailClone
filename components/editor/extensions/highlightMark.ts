import { Mark, mergeAttributes } from "@tiptap/core";

export interface HighlightMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlightMark: {
      setHighlightMark: (highlightId: string) => ReturnType;
      unsetHighlightMark: (highlightId: string) => ReturnType;
    };
  }
}

export const HighlightMark = Mark.create<HighlightMarkOptions>({
  name: "highlight",

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
    return [{ tag: "mark[data-highlight-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "note-highlight",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setHighlightMark:
        (highlightId: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { highlightId }),
      unsetHighlightMark:
        (highlightId: string) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          let found = false;
          doc.descendants((node, pos) => {
            const mark = node.marks.find(
              (m) => m.type.name === "highlight" && m.attrs.highlightId === highlightId,
            );
            if (mark) {
              found = true;
              tr.removeMark(pos, pos + node.nodeSize, mark.type);
            }
          });
          if (found && dispatch) dispatch(tr);
          return found;
        },
    };
  },
});
