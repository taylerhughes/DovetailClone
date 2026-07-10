"use client";

import { usePathname } from "next/navigation";

export function ProjectHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide on note detail pages — the note has its own title bar
  const isNotePage = /\/data\/[^/]+$/.test(pathname);
  if (isNotePage) return null;
  return <>{children}</>;
}
