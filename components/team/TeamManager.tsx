"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  createTeamMember,
  deleteTeamMember,
  renameTeamMember,
} from "@/actions/teamMembers";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";

type Member = { id: string; name: string; color: string };

export function TeamManager({
  projectId,
  initialMembers,
}: {
  projectId: string;
  initialMembers: Member[];
}) {
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { canEdit } = useProjectAccess();

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <form
          className="flex gap-2"
          action={() => {
            if (!newName.trim()) return;
            startTransition(async () => {
              await createTeamMember(projectId, newName);
              setNewName("");
              router.refresh();
            });
          }}
        >
          <Input
            placeholder="New team member name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" disabled={isPending || !newName.trim()}>
            <Plus data-icon="inline-start" />
            Add member
          </Button>
        </form>
      )}

      {initialMembers.length === 0 ? (
        <Text size={100} color="subdued">No team members yet. Add people to assign them to notes via the Person field type.</Text>
      ) : (
        <div className="flex flex-col divide-y rounded-lg border">
          {initialMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3">
              <Avatar className="size-6">
                <AvatarFallback
                  style={{ backgroundColor: member.color, color: "white" }}
                >
                  {member.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Input
                defaultValue={member.name}
                className="h-7 max-w-48"
                readOnly={!canEdit}
                onBlur={(e) => {
                  if (
                    canEdit &&
                    e.target.value.trim() &&
                    e.target.value !== member.name
                  ) {
                    startTransition(async () => {
                      await renameTeamMember(member.id, e.target.value);
                      router.refresh();
                    });
                  }
                }}
              />
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Delete team member"
                  className="ml-auto"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteTeamMember(member.id);
                      router.refresh();
                    })
                  }
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
