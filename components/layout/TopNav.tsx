import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, getActiveOrganizationId } from "@/lib/auth/session";
import { isAiEnabled } from "@/lib/ai/client";
import { isEmbeddingsEnabled } from "@/lib/embeddings/client";
import { UserMenu } from "@/components/auth/UserMenu";
import { OrgSwitcher } from "@/components/organizations/OrgSwitcher";
import { Text } from "@/components/ui/text";

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
      <Link href="/">
        <Text as="span" size={100} weight="bold">Willard</Text>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/search" className="flex items-center gap-2 hover:text-foreground">
          <Search className="size-4 text-muted-foreground" />
          <Text as="span" size={100} color="subdued">Search</Text>
          <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </Link>
        {user && isAiEnabled() && isEmbeddingsEnabled() && (
          <Link href="/ask" className="flex items-center gap-2 hover:text-foreground">
            <Sparkles className="size-4 text-muted-foreground" />
            <Text as="span" size={100} color="subdued">Ask AI</Text>
          </Link>
        )}
        {user ? (
          <>
            <OrgSwitcher
              organizations={organizations}
              activeOrganizationId={activeOrganizationId}
            />
            <UserMenu email={user.email} />
          </>
        ) : (
          <Link href="/sign-in">
            <Text as="span" size={100} color="subdued">Sign in</Text>
          </Link>
        )}
      </div>
    </header>
  );
}
