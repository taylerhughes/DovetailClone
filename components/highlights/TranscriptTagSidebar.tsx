"use client";

import { useEffect, useRef, useState } from "react";
import { TagBadge } from "@/components/tags/TagBadge";
import type { TagOption } from "@/components/tags/TagPicker";

type HighlightEntry = { id: string; markId: string | null; tagIds: string[] };

export function TranscriptTagSidebar({
  highlights,
  allTags,
}: {
  highlights: HighlightEntry[];
  allTags: TagOption[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<
    { markId: string; top: number; tags: TagOption[] }[]
  >([]);

  useEffect(() => {
    function measure() {
      const container = containerRef.current;
      if (!container) return;
      const containerTop =
        container.getBoundingClientRect().top + window.scrollY;

      const next = highlights
        .filter((h) => h.markId && h.tagIds.length > 0)
        .flatMap((h) => {
          const el = document.querySelector<HTMLElement>(
            `mark[data-highlight-id="${CSS.escape(h.markId!)}"]`,
          );
          if (!el) return [];
          const elTop =
            el.getBoundingClientRect().top + window.scrollY - containerTop;
          const tags = h.tagIds
            .map((id) => allTags.find((t) => t.id === id))
            .filter((t): t is TagOption => t != null);
          return [{ markId: h.markId!, top: elTop, tags }];
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
  }, [highlights, allTags]);

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {positions.map(({ markId, top, tags }) => (
        <div
          key={markId}
          className="absolute left-3 flex flex-col gap-1"
          style={{ top }}
        >
          {tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      ))}
    </div>
  );
}
