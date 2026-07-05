import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { OrgNameInput } from "@/components/organizations/OrgNameInput";
import { OrgMembersPanel } from "@/components/organizations/OrgMembersPanel";
import { InviteMemberPanel } from "@/components/organizations/InviteMemberPanel";
import { LeaveOrgButton } from "@/components/organizations/LeaveOrgButton";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const user = await requireUser();

  const membership = await db.member.findFirst({
    where: { organizationId: orgId, userId: user.id },
  });
  if (!membership) notFound();

  const [organization, members, invitations] = await Promise.all([
    db.organization.findUnique({ where: { id: orgId } }),
    db.member.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.invitation.findMany({
      where: { organizationId: orgId, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!organization) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div>
        <Link
          href="/organizations"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Organizations
        </Link>
        <div className="mt-1">
          <OrgNameInput orgId={organization.id} initialName={organization.name} />
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Members</h2>
        <OrgMembersPanel
          orgId={orgId}
          currentUserId={user.id}
          members={members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
          }))}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Invite people</h2>
        <InviteMemberPanel
          orgId={orgId}
          invitations={invitations.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role ?? "member",
          }))}
        />
      </section>

      <section className="border-t pt-4">
        <LeaveOrgButton orgId={orgId} />
      </section>
    </main>
  );
}
