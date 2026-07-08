import { cn } from "@/lib/utils"
import { Text } from "@/components/ui/text";
import { AvatarPrimitive } from "@/components/ui/avatar-primitive";

export type TranscriptHighlight = {
  start: number;
  end: number;
  color: "blue" | "zinc";
};

export type TranscriptSegmentProps = {
  speakerName: string;
  speakerInitials?: string;
  text: string;
  highlights?: TranscriptHighlight[];
  className?: string;
};

export type TranscriptSpeakerProps = {
  speakerName: string;
  speakerInitials?: string;
};

export function TranscriptSpeaker({ speakerName, speakerInitials }: TranscriptSpeakerProps) {
  return (
    <div className="inline-flex justify-start items-center gap-4">
      <AvatarPrimitive size="sm" initials={speakerInitials} />
      <Text as="span" size={100} weight="bold">
        {speakerName}
      </Text>
    </div>
  );
}

const highlightClass: Record<TranscriptHighlight["color"], string> = {
  blue: "bg-blue-300",
  zinc: "bg-zinc-100",
};

export function TranscriptSegment({
  speakerName,
  speakerInitials,
  text,
  highlights,
  className,
}: TranscriptSegmentProps) {
  const safeHighlights = Array.isArray(highlights) ? highlights : [];

  return (
    <div
      className={cn(
        "self-stretch inline-flex flex-col justify-start items-start gap-2",
        className,
      )}
    >
      <TranscriptSpeaker speakerName={speakerName} speakerInitials={speakerInitials} />
      <Text as="p" size={100} weight="medium" color="subdued" className="self-stretch">
        {safeHighlights.length > 0
          ? renderWithHighlights(text, safeHighlights)
          : text}
      </Text>
    </div>
  );
}

function renderWithHighlights(text: string, highlights: TranscriptHighlight[]) {
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const spans: React.ReactNode[] = [];
  let cursor = 0;

  for (const h of sorted) {
    const start = Math.max(h.start, cursor);
    const end = Math.min(h.end, text.length);
    if (start >= end) continue;

    if (start > cursor) {
      spans.push(
        <span key={`t-${cursor}`}>
          {text.slice(cursor, start)}
        </span>,
      );
    }
    spans.push(
      <mark
        key={`h-${start}`}
        className={cn("text-foreground", highlightClass[h.color])}
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }

  if (cursor < text.length) {
    spans.push(
      <span key={`t-${cursor}`}>
        {text.slice(cursor)}
      </span>,
    );
  }

  return spans;
}
