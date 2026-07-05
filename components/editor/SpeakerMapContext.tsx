import { createContext } from "react";

/** attachmentId -> (speakerLabel -> display name) */
export const SpeakerMapContext = createContext<Map<string, Map<string, string>>>(
  new Map(),
);
