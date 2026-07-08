"use client";

import { Sparkles } from "lucide-react";
import { TAG_COLORS } from "@/lib/palette";
import { recolorTag } from "@/actions/tags";

export function AiTagBadge({
  tagId,
  name,
  color,
  onAccept,
  onReject,
}: {
  tagId: string;
  name: string;
  color: string;
  onAccept: () => void;
  onReject: () => void;
}) {
  async function handleRecolor(next: string) {
    await recolorTag(tagId, next);
  }

  return (
    <div className="group/ai-tag relative inline-flex flex-col items-end">
      {/* Card shell — invisible by default, expands on hover behind the pill */}
      <div className="absolute inset-0 rounded-3xl bg-zinc-100 opacity-0 transition-opacity group-hover/ai-tag:opacity-100" />

      {/* Content column — pill pinned top-right, buttons + picker below */}
      <div className="relative flex flex-col items-start gap-2 p-4 pt-4">
        {/* Pill — always visible, sits at the end (right) */}
        <div className="self-end">
          <div
            className="inline-flex cursor-default items-center gap-1.5 rounded-[99px] px-2 py-1"
            style={{ backgroundColor: color }}
          >
            <Sparkles className="size-3 text-black" />
            <span className="font-['Satoshi'] text-xs font-bold text-black">{name}</span>
          </div>
        </div>

        {/* Buttons + colour picker — hidden until hover */}
        <div className="flex flex-col gap-2 opacity-0 transition-opacity group-hover/ai-tag:opacity-100 pointer-events-none group-hover/ai-tag:pointer-events-auto">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReject}
              className="rounded-sm bg-zinc-400 px-2 py-1 font-['Satoshi'] text-xs font-bold text-black hover:bg-zinc-500"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="rounded-sm bg-zinc-400 px-2 py-1 font-['Satoshi'] text-xs font-bold text-black hover:bg-zinc-500"
            >
              Accept
            </button>
          </div>

          {/* Colour picker */}
          <div className="flex flex-wrap gap-1.5">
            {TAG_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Set colour ${swatch}`}
                onClick={() => handleRecolor(swatch)}
                className="size-4 rounded-full ring-offset-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                style={{
                  backgroundColor: swatch,
                  boxShadow: swatch === color ? `0 0 0 2px white, 0 0 0 3px ${swatch}` : undefined,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
