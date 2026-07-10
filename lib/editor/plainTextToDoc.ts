import type { JSONContent } from "@tiptap/react";

export function plainTextToDoc(text: string): JSONContent {
  const lines = (text ?? "").split("\n").filter(Boolean);
  if (lines.length === 0) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line }],
    })),
  };
}
