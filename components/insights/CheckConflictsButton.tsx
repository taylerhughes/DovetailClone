"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

export function CheckConflictsButton({ insightId }: { insightId: string }) {
  const router = useRouter();
  const { canEdit } = useProjectAccess();
  const [loading, setLoading] = useState(false);

  if (!canEdit) return null;

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/check-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Conflict check failed");
        return;
      }
      if (data.conflictCount === 0) {
        toast.success("No conflicts found");
      }
      router.refresh();
    } catch {
      toast.error("Conflict check failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={handleClick}>
      <ShieldAlert data-icon="inline-start" />
      {loading ? "Checking…" : "Check for conflicts"}
    </Button>
  );
}
