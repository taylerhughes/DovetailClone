"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createIntegration } from "@/actions/integrations";

interface Project {
  id: string;
  name: string;
}

export function NewIntegrationForm({ projects }: { projects: Project[] }) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = data.get("name") as string;
    const projectId = data.get("projectId") as string;
    if (!name.trim() || !projectId) return;
    setPending(true);
    await createIntegration(projectId, name.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Integration name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Interviews from Typeform"
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          A label to help you identify this integration later.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="projectId" className="text-sm font-medium">
          Target project
        </label>
        <select
          id="projectId"
          name="projectId"
          required
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select a project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          New notes from Zapier will be created in this project.
        </p>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creating…" : "Create integration"}
      </Button>
    </form>
  );
}
