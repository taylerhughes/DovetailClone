"use client";

import { useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarPrimitive } from "@/components/ui/avatar-primitive";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { setSpeakerMapping } from "@/actions/transcription";
import { SpeakerMapContext } from "@/components/editor/SpeakerMapContext";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function InlineSpeakerPicker({
  attachmentId,
  speakerLabel,
  displayName,
}: {
  attachmentId: string;
  speakerLabel: string;
  displayName: string;
}) {
  const { rawSpeakerMaps, teamMembers } = useContext(SpeakerMapContext);
  const { canEdit } = useProjectAccess();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentMemberId = rawSpeakerMaps.get(attachmentId)?.[speakerLabel] ?? null;

  const filtered = teamMembers.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  function handleSelect(memberId: string | null) {
    startTransition(async () => {
      await setSpeakerMapping(attachmentId, speakerLabel, memberId);
      setOpen(false);
      setQuery("");
      router.refresh();
    });
  }

  const avatarInitials = initials(displayName) || speakerLabel.slice(0, 2).toUpperCase();

  if (!canEdit) {
    return (
      <div className="inline-flex items-center gap-2">
        <AvatarPrimitive size="sm" initials={avatarInitials} />
        <Text as="span" size={100} weight="bold">{displayName}</Text>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-1 py-0.5 -mx-1 transition-colors",
              "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isPending && "opacity-60",
            )}
          />
        }
      >
        <AvatarPrimitive size="sm" initials={avatarInitials} />
        <Text as="span" size={100} weight="bold">{displayName}</Text>
        <ChevronDown className="size-3 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent side="bottom" align="start" className="w-64 p-0">
        <div className="p-2 border-b">
          <Input
            autoFocus
            placeholder="Search participants…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 text-sm"
          />
        </div>
        <div className="flex max-h-56 flex-col overflow-y-auto p-1">
          {/* Unassign option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-left hover:bg-muted"
          >
            <AvatarPrimitive size="sm" initials={speakerLabel.slice(0, 2).toUpperCase()} />
            <span className="flex-1">{speakerLabel} (unassigned)</span>
            {currentMemberId === null && <Check className="size-3.5 text-primary" />}
          </button>

          {filtered.length === 0 && query && (
            <p className="px-2 py-2 text-sm text-muted-foreground">No participants found.</p>
          )}

          {filtered.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelect(member.id)}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-left hover:bg-muted"
            >
              <AvatarPrimitive size="sm" initials={initials(member.name)} />
              <span className="flex-1">{member.name}</span>
              {currentMemberId === member.id && <Check className="size-3.5 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
