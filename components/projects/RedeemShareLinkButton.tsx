"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { redeemShareLink } from "@/actions/projectSharing";

export function RedeemShareLinkButton({
  token,
  role,
}: {
  token: string;
  role: "VIEWER" | "EDITOR";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const { projectId } = await redeemShareLink(token);
        router.push(`/projects/${projectId}/data`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to join project");
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending
        ? "Joining…"
        : `Get ${role === "EDITOR" ? "edit" : "view"} access`}
    </Button>
  );
}
