import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { CreateOrgDialog } from "@/components/organizations/CreateOrgDialog";

export default async function OrganizationsPage() {
  const user = await requireUser();

  const memberships = await db.member.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { organization: { name: "asc" } },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Organizations</h1>
        <CreateOrgDialog />
      </div>

      {memberships.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
          <p className="text-sm font-medium">No organizations yet</p>
          <p className="text-sm text-muted-foreground">
            Create one to share projects with a team.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {memberships.map((m) => (
            <Link
              key={m.organization.id}
              href={`/organizations/${m.organization.id}`}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
            >
              <span className="font-medium">{m.organization.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {m.role}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
