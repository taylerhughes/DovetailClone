"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Share2, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addProjectShare,
  removeProjectShare,
  updateProjectShareRole,
  setOrgShare,
  setShareLink,
  regenerateShareLink,
} from "@/actions/projectSharing";
import type { ProjectRole } from "@/lib/generated/prisma/client";

type Share = { userId: string; name: string; email: string; role: ProjectRole };

function RoleSelect({
  value,
  onChange,
}: {
  value: ProjectRole;
  onChange: (role: ProjectRole) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as ProjectRole)}>
      <SelectTrigger className="h-8 w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="VIEWER">Viewer</SelectItem>
        <SelectItem value="EDITOR">Editor</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function ShareDialog({
  projectId,
  shares,
  organizationName,
  orgShareEnabled: initialOrgShareEnabled,
  orgShareRole: initialOrgShareRole,
  shareLinkEnabled: initialShareLinkEnabled,
  shareLinkToken: initialShareLinkToken,
  shareLinkRole: initialShareLinkRole,
}: {
  projectId: string;
  shares: Share[];
  organizationName: string | null;
  orgShareEnabled: boolean;
  orgShareRole: ProjectRole;
  shareLinkEnabled: boolean;
  shareLinkToken: string | null;
  shareLinkRole: ProjectRole;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [addRole, setAddRole] = useState<ProjectRole>("VIEWER");
  const [isPending, startTransition] = useTransition();

  const [orgShareEnabled, setOrgShareEnabled] = useState(initialOrgShareEnabled);
  const [orgShareRole, setOrgShareRole] = useState(initialOrgShareRole);
  const [shareLinkEnabled, setShareLinkEnabled] = useState(initialShareLinkEnabled);
  const [shareLinkRole, setShareLinkRoleState] = useState(initialShareLinkRole);
  const [shareLinkToken, setShareLinkTokenState] = useState(initialShareLinkToken);

  const shareUrl =
    shareLinkToken && typeof window !== "undefined"
      ? `${window.location.origin}/share/${shareLinkToken}`
      : null;

  function handleAdd() {
    const trimmed = email.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        await addProjectShare(projectId, trimmed, addRole);
        setEmail("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add");
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Share2 data-icon="inline-start" />
        Share
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            Control who can view or edit this project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              People with access
            </span>
            <div className="flex items-end gap-2">
              <Input
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <RoleSelect value={addRole} onChange={setAddRole} />
              <Button size="sm" disabled={isPending} onClick={handleAdd}>
                Add
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              {shares.map((share) => (
                <div
                  key={share.userId}
                  className="flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm">{share.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {share.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RoleSelect
                      value={share.role}
                      onChange={(role) => {
                        startTransition(async () => {
                          await updateProjectShareRole(projectId, share.userId, role);
                          router.refresh();
                        });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Remove access"
                      onClick={() => {
                        startTransition(async () => {
                          await removeProjectShare(projectId, share.userId);
                          router.refresh();
                        });
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {organizationName && (
            <section className="flex items-center justify-between gap-2 border-t pt-4">
              <div className="flex flex-col">
                <span className="text-sm">Share with {organizationName}</span>
                <span className="text-xs text-muted-foreground">
                  Every member of the organization gets access
                </span>
              </div>
              <div className="flex items-center gap-2">
                {orgShareEnabled && (
                  <RoleSelect
                    value={orgShareRole}
                    onChange={(role) => {
                      setOrgShareRole(role);
                      startTransition(async () => {
                        await setOrgShare(projectId, true, role);
                        router.refresh();
                      });
                    }}
                  />
                )}
                <Button
                  variant={orgShareEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const next = !orgShareEnabled;
                    setOrgShareEnabled(next);
                    startTransition(async () => {
                      await setOrgShare(projectId, next, orgShareRole);
                      router.refresh();
                    });
                  }}
                >
                  {orgShareEnabled ? "On" : "Off"}
                </Button>
              </div>
            </section>
          )}

          <section className="flex flex-col gap-2 border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm">Share link</span>
                <span className="text-xs text-muted-foreground">
                  Anyone with the link can access this project
                </span>
              </div>
              <div className="flex items-center gap-2">
                {shareLinkEnabled && (
                  <RoleSelect
                    value={shareLinkRole}
                    onChange={(role) => {
                      setShareLinkRoleState(role);
                      startTransition(async () => {
                        await setShareLink(projectId, true, role);
                        router.refresh();
                      });
                    }}
                  />
                )}
                <Button
                  variant={shareLinkEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const next = !shareLinkEnabled;
                    setShareLinkEnabled(next);
                    startTransition(async () => {
                      const token = await setShareLink(projectId, next, shareLinkRole);
                      if (token) setShareLinkTokenState(token);
                    });
                  }}
                >
                  {shareLinkEnabled ? "On" : "Off"}
                </Button>
              </div>
            </div>
            {shareLinkEnabled && shareUrl && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-xs">
                <span className="flex-1 truncate">{shareUrl}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Copy link"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied");
                  }}
                >
                  <Copy />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    startTransition(async () => {
                      const token = await regenerateShareLink(projectId);
                      setShareLinkTokenState(token);
                      toast.success("Link regenerated");
                    });
                  }}
                >
                  Regenerate
                </Button>
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
