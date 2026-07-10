import Link from "next/link";
import { Zap } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { Text } from "@/components/ui/text";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { IntegrationToggle } from "@/components/integrations/IntegrationToggle";

export default async function IntegrationsPage() {
  const user = await requireUser();

  const integrations = await db.integration.findMany({
    where: { userId: user.id },
    include: { project: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <div className="mb-8">
        <Text as="p" size={300} weight="bold">Integrations</Text>
        <Text as="p" size={100} color="subdued" className="mt-1">
          Connect external tools to automatically bring data into Willard.
        </Text>
      </div>

      <section className="mb-10">
        <Text as="p" size={200} weight="medium" className="mb-4">Available</Text>
        <IntegrationCard
          name="Zapier"
          description="Trigger a Zap to create a new note in any project. Connect 6,000+ apps without writing code."
          href="/integrations/zapier/new"
          logo={<Zap className="size-5 text-[#FF4A00]" />}
        />
      </section>

      {integrations.length > 0 && (
        <section>
          <Text as="p" size={200} weight="medium" className="mb-4">Your integrations</Text>
          <div className="flex flex-col divide-y rounded-xl border">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center gap-4 px-5 py-4">
                <Zap className="size-4 shrink-0 text-[#FF4A00]" />
                <div className="flex flex-1 flex-col">
                  <Link
                    href={`/integrations/${integration.id}`}
                    className="text-sm font-medium hover:underline underline-offset-4"
                  >
                    {integration.name}
                  </Link>
                  <Text as="span" size={75} color="subdued">
                    {integration.project.name}
                  </Text>
                </div>
                <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  Zapier
                </span>
                <IntegrationToggle id={integration.id} enabled={integration.enabled} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
