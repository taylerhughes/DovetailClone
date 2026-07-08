"use client";

import { useRouter } from "next/navigation";
import { Text } from "@/components/ui/text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setSpeakerMapping } from "@/actions/transcription";

export function SpeakerMappingPanel({
  attachmentId,
  speakers,
  speakerMap,
  teamMembers,
}: {
  attachmentId: string;
  speakers: string[];
  speakerMap: Record<string, string>;
  teamMembers: { id: string; name: string }[];
}) {
  const router = useRouter();

  if (speakers.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 rounded-md border p-2">
      <Text as="span" size={75} weight="medium" color="subdued">Speakers</Text>
      {speakers.map((speaker) => (
        <div key={speaker} className="flex items-center gap-2">
          <Text as="span" size={75} className="w-24 shrink-0">{speaker}</Text>
          <Select
            value={speakerMap[speaker] ?? "__none__"}
            onValueChange={async (v) => {
              await setSpeakerMapping(
                attachmentId,
                speaker,
                v === "__none__" ? null : v,
              );
              router.refresh();
            }}
          >
            <SelectTrigger className="h-7 w-full">
              <SelectValue placeholder={speaker}>
                {(v: string) =>
                  v === "__none__" || !v
                    ? speaker
                    : (teamMembers.find((m) => m.id === v)?.name ?? speaker)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{speaker}</SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
