"use client";

import { useEffect, useRef, useState } from "react";
import { AiTagBadge } from "@/components/ui/AiTagBadge";

export interface SuggestedTagAssignment {
  markId: string;
  highlightId: string;
  tags: { id: string; name: string; color: string }[];
}

export function AiSuggestedTagsOverlay({
  suggestedTagAssignments,
  onAccept,
  onReject,
}: {
  suggestedTagAssignments: SuggestedTagAssignment[];
  onAccept: (markId: string, tagId: string) => void;
  onReject: (markId: string, tagId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<
    { markId: string; top: number; tags: { id: string; name: string; color: string }[] }[]
  >([]);

  useEffect(() => {
    function measure() {
      const container = containerRef.current;
      if (!container) return;
      const containerTop = container.getBoundingClientRect().top + window.scrollY;

      const next = suggestedTagAssignments
        .filter((a) => a.tags.length > 0)
        .flatMap((a) => {
          const el = document.querySelector<HTMLElement>(
            `mark[data-highlight-id="${CSS.escape(a.markId)}"]`,
          );
          if (!el) return [];
          const elTop = el.getBoundingClientRect().top + window.scrollY - containerTop;
          return [{ markId: a.markId, top: elTop, tags: a.tags }];
        });

      setPositions(next);
    }

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [suggestedTagAssignments]);

  if (suggestedTagAssignments.length === 0) return null;

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {positions.map(({ markId, top, tags }) => (
        <div
          key={markId}
          className="absolute left-3 flex flex-col gap-1"
          style={{ top }}
        >
          {tags.map((tag) => (
            <AiTagBadge
              key={tag.id}
              tagId={tag.id}
              name={tag.name}
              color={tag.color}
              onAccept={() => onAccept(markId, tag.id)}
              onReject={() => onReject(markId, tag.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
