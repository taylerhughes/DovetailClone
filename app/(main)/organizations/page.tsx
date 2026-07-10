import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { CreateOrgDialog } from "@/components/organizations/CreateOrgDialog";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

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
        <Heading level={1} size={700}>Organizations</Heading>
        <CreateOrgDialog />
      </div>

      {memberships.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
          <Text size={100} weight="medium">No organizations yet</Text>
          <Text size={100} color="subdued">Create one to share projects with a team.</Text>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {memberships.map((m) => (
            <Link
              key={m.organization.id}
              href={`/organizations/${m.organization.id}`}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
            >
              <Text as="span" size={100} weight="medium">{m.organization.name}</Text>
              <Text as="span" size={75} color="subdued" className="capitalize">{m.role}</Text>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
