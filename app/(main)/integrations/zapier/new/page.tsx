import { Zap } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { Text } from "@/components/ui/text";
import { NewIntegrationForm } from "@/components/integrations/NewIntegrationForm";

export default async function ZapierNewPage() {
  const user = await requireUser();

  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border bg-card">
          <Zap className="size-5 text-[#FF4A00]" />
        </div>
        <div>
          <Text as="p" size={300} weight="bold">Connect Zapier</Text>
          <Text as="p" size={100} color="subdued">
            Create notes in Willard automatically from any Zapier trigger.
          </Text>
        </div>
      </div>

      <NewIntegrationForm projects={projects} />
    </div>
  );
}
