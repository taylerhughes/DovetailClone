"use client";

import { useState, useTransition } from "react";
import { toggleIntegration } from "@/actions/integrations";

export function IntegrationToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const [optimistic, setOptimistic] = useState(enabled);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(() => toggleIntegration(id, next));
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      onClick={toggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        optimistic ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          optimistic ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
