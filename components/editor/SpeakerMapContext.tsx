import { createContext } from "react";

export interface TeamMemberOption {
  id: string;
  name: string;
}

export interface SpeakerMapContextValue {
  /** attachmentId -> (speakerLabel -> display name) */
  speakerMaps: Map<string, Map<string, string>>;
  /** attachmentId -> (speakerLabel -> teamMemberId) */
  rawSpeakerMaps: Map<string, Record<string, string>>;
  teamMembers: TeamMemberOption[];
}

export const SpeakerMapContext = createContext<SpeakerMapContextValue>({
  speakerMaps: new Map(),
  rawSpeakerMaps: new Map(),
  teamMembers: [],
});
