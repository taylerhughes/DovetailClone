"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronsUpDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";

export function OrgSwitcher({
  organizations,
  activeOrganizationId,
}: {
  organizations: { id: string; name: string }[];
  activeOrganizationId: string | null;
}) {
  const router = useRouter();
  const active = organizations.find((o) => o.id === activeOrganizationId);

  async function switchTo(organizationId: string | null) {
    await authClient.organization.setActive({ organizationId });
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="max-w-40 truncate" />}
      >
        {active ? active.name : "Personal"}
        <ChevronsUpDown data-icon="inline-end" className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchTo(null)}>
          {!active && <Check className="size-3.5" />}
          Personal
        </DropdownMenuItem>
        {organizations.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => switchTo(org.id)}>
            {active?.id === org.id && <Check className="size-3.5" />}
            {org.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/organizations" />}>
          <Settings /> Manage organizations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
