import type { JSONContent } from "@tiptap/react";

export function docToPlainText(doc: JSONContent | null | undefined): string {
  if (!doc) return "";

  const parts: string[] = [];

  function walk(node: JSONContent) {
    if (node.type === "text" && node.text) {
      parts.push(node.text);
    }
    if (node.content) {
      for (const child of node.content) {
        walk(child);
      }
    }
    if (node.type === "paragraph" || node.type === "heading") {
      parts.push("\n");
    }
  }

  walk(doc);

  return parts.join("").replace(/\n{3,}/g, "\n\n").trim();
}

export const emptyDoc: JSONContent = { type: "doc", content: [] };
