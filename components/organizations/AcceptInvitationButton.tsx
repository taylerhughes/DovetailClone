"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function AcceptInvitationButton({
  invitationId,
  organizationId,
}: {
  invitationId: string;
  organizationId: string;
}) {
  const router = useRouter();

  async function handleAccept() {
    const { error } = await authClient.organization.acceptInvitation({ invitationId });
    if (error) {
      toast.error(error.message ?? "Failed to accept invitation");
      return;
    }
    router.push(`/organizations/${organizationId}`);
    router.refresh();
  }

  return <Button onClick={handleAccept}>Join organization</Button>;
}
