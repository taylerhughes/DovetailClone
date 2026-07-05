"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth/client";

type Invitation = { id: string; email: string; role: string };

export function InviteMemberPanel({
  orgId,
  invitations,
}: {
  orgId: string;
  invitations: Invitation[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [isPending, startTransition] = useTransition();
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  function handleInvite() {
    const trimmed = email.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const { data, error } = await authClient.organization.inviteMember({
        organizationId: orgId,
        email: trimmed,
        role,
      });
      if (error) {
        toast.error(error.message ?? "Failed to invite member");
        return;
      }
      setEmail("");
      setLastInviteLink(
        `${window.location.origin}/organizations/accept-invitation?id=${data.id}`,
      );
      router.refresh();
    });
  }

  async function cancelInvitation(invitationId: string) {
    const { error } = await authClient.organization.cancelInvitation({
      invitationId,
    });
    if (error) {
      toast.error(error.message ?? "Failed to cancel invitation");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Invite by email</span>
          <Input
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Select
          value={role}
          onValueChange={(v) => v && setRole(v as "admin" | "member")}
        >
          <SelectTrigger className="h-9 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
        <Button disabled={isPending} onClick={handleInvite}>
          {isPending ? "Inviting…" : "Invite"}
        </Button>
      </div>

      {lastInviteLink && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-xs">
          <span className="flex-1 truncate">{lastInviteLink}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Copy invite link"
            onClick={() => {
              navigator.clipboard.writeText(lastInviteLink);
              toast.success("Invite link copied");
            }}
          >
            <Copy />
          </Button>
        </div>
      )}

      {invitations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Pending invitations
          </span>
          {invitations.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
            >
              <span>
                {invite.email}{" "}
                <span className="text-xs text-muted-foreground capitalize">
                  ({invite.role})
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Cancel invitation"
                onClick={() => cancelInvitation(invite.id)}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
