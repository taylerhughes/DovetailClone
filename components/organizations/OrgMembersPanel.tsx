"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth/client";

type Member = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
};

export function OrgMembersPanel({
  orgId,
  members,
  currentUserId,
}: {
  orgId: string;
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();

  async function changeRole(memberId: string, role: string) {
    const { error } = await authClient.organization.updateMemberRole({
      organizationId: orgId,
      memberId,
      role,
    });
    if (error) {
      toast.error(error.message ?? "Failed to update role");
      return;
    }
    router.refresh();
  }

  async function removeMember(memberIdOrEmail: string) {
    const { error } = await authClient.organization.removeMember({
      organizationId: orgId,
      memberIdOrEmail,
    });
    if (error) {
      toast.error(error.message ?? "Failed to remove member");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between gap-2 rounded-lg border p-3"
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium">{member.name}</span>
            <span className="text-xs text-muted-foreground">{member.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={member.role}
              onValueChange={(role) => role && changeRole(member.id, role)}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              disabled={member.userId === currentUserId}
              onClick={() => removeMember(member.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
