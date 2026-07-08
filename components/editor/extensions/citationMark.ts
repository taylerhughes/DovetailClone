import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    citation: {
      insertCitation: (number: number) => ReturnType;
    };
  }
}

export const CitationNode = Node.create({
  name: "citation",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      number: {
        default: null,
        parseHTML: (element) => Number(element.getAttribute("data-citation")),
        renderHTML: (attributes) => ({ "data-citation": attributes.number }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-citation]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class:
          "inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] rounded-full bg-muted text-muted-foreground text-[0.625rem] font-medium font-type-body cursor-default select-none mx-0.5 align-middle",
        contenteditable: "false",
      }),
      String(HTMLAttributes["data-citation"] ?? ""),
    ];
  },

  addCommands() {
    return {
      insertCitation:
        (number: number) =>
        ({ commands }) =>
          commands.insertContent({ type: "citation", attrs: { number } }),
    };
  },
});
