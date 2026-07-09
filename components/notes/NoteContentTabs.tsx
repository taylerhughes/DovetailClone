"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "transcript", label: "Transcript" },
  { id: "tags", label: "Tags" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function NoteContentTabs({
  transcriptContent,
  tagsContent,
}: {
  transcriptContent: React.ReactNode;
  tagsContent: React.ReactNode;
}) {
  const [active, setActive] = useState<TabId>("transcript");

  return (
    <div className="flex flex-col gap-0">
      <div className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors -mb-px",
              active === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {active === "transcript" ? transcriptContent : tagsContent}
      </div>
    </div>
  );
}
