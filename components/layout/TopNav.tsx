import Link from "next/link";
import { Search } from "lucide-react";

export function TopNav() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        DovetailClone
      </Link>
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
    </header>
  );
}
