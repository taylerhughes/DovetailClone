import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    citation: {
      insertCitation: (number: number, markId?: string) => ReturnType;
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
      markId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-citation-mark-id") ?? null,
        renderHTML: (attributes) =>
          attributes.markId ? { "data-citation-mark-id": attributes.markId } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-citation]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const markId = HTMLAttributes["data-citation-mark-id"];
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class:
          "inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] rounded-full bg-muted text-muted-foreground text-[0.625rem] font-medium font-type-body select-none mx-0.5 align-middle" +
          (markId ? " cursor-pointer hover:bg-muted-foreground/20" : " cursor-default"),
        contenteditable: "false",
        ...(markId
          ? {
              role: "button",
              "aria-label": `Jump to citation ${HTMLAttributes["data-citation"]}`,
              onclick: `(function(){var m=document.querySelector('mark[data-highlight-id="${markId}"]');if(m){m.scrollIntoView({behavior:'smooth',block:'center'});m.classList.add('note-highlight-active');setTimeout(function(){m.classList.remove('note-highlight-active')},1500);}})()`,
            }
          : {}),
      }),
      String(HTMLAttributes["data-citation"] ?? ""),
    ];
  },

  addCommands() {
    return {
      insertCitation:
        (number: number, markId?: string) =>
        ({ commands }) =>
          commands.insertContent({ type: "citation", attrs: { number, markId: markId ?? null } }),
    };
  },
});
