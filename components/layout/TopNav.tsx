import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, getActiveOrganizationId } from "@/lib/auth/session";
import { UserMenu } from "@/components/auth/UserMenu";
import { OrgSwitcher } from "@/components/organizations/OrgSwitcher";

export async function TopNav() {
  const user = await getCurrentUser();
  const organizations = user
    ? await db.organization.findMany({
        where: { members: { some: { userId: user.id } } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];
  const activeOrganizationId = user ? await getActiveOrganizationId() : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        DovetailClone
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/search"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Search className="size-4" />
          Search
          <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </Link>
        {user ? (
          <>
            <OrgSwitcher
              organizations={organizations}
              activeOrganizationId={activeOrganizationId}
            />
            <UserMenu email={user.email} />
          </>
        ) : (
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
