import { createContext } from "react";

export interface HighlightEmbedData {
  quote: string;
  wholeNote: boolean;
  noteId: string;
  noteTitle: string;
  tags: { id: string; name: string; color: string }[];
}

export const HighlightDataContext = createContext<
  Map<string, HighlightEmbedData>
>(new Map());
