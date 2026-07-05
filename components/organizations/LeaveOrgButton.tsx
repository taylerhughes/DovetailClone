"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function LeaveOrgButton({ orgId }: { orgId: string }) {
  const router = useRouter();

  async function handleLeave() {
    const { error } = await authClient.organization.leave({ organizationId: orgId });
    if (error) {
      toast.error(error.message ?? "Failed to leave organization");
      return;
    }
    router.push("/organizations");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLeave}>
      Leave organization
    </Button>
  );
}
