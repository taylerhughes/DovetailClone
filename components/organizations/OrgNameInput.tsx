"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function OrgNameInput({
  orgId,
  initialName,
}: {
  orgId: string;
  initialName: string;
}) {
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <input
      defaultValue={initialName}
      onChange={(e) => {
        const value = e.target.value.trim();
        if (!value) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
          await authClient.organization.update({ organizationId: orgId, data: { name: value } });
          router.refresh();
        }, 600);
      }}
      className="w-full border-none bg-transparent text-fs-700 leading-type-tight font-type-heading font-bold outline-none"
    />
  );
}
