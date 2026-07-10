import { notFound } from "next/navigation";
import Link from "next/link";
import { Zap, ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { WebhookUrlCopy } from "@/components/integrations/WebhookUrlCopy";
import { IntegrationEventLog } from "@/components/integrations/IntegrationEventLog";
import { IntegrationToggle } from "@/components/integrations/IntegrationToggle";
import { deleteIntegration } from "@/actions/integrations";

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const integration = await db.integration.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      events: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { integration: { select: { projectId: true } } },
      },
    },
  });

  if (!integration || integration.userId !== user.id) notFound();

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhooks/ingest/${integration.secret}`;

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <Link
        href="/integrations"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Integrations
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border bg-card">
          <Zap className="size-5 text-[#FF4A00]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Text as="p" size={200} weight="bold">{integration.name}</Text>
            <IntegrationToggle id={integration.id} enabled={integration.enabled} />
          </div>
          <Text as="p" size={75} color="subdued">
            Zapier → {integration.project.name}
          </Text>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <section>
          <Text as="p" size={100} weight="medium" className="mb-2">Webhook URL</Text>
          <WebhookUrlCopy url={webhookUrl} />
          <Text as="p" size={75} color="subdued" className="mt-2">
            Paste this URL into your Zap as the webhook action endpoint. Keep it secret — anyone with this URL can create notes in your project.
          </Text>
        </section>

        <section>
          <Text as="p" size={100} weight="medium" className="mb-3">Setup instructions</Text>
          <ol className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>1. In Zapier, create a new Zap and choose your trigger app (e.g. Typeform, Google Forms).</li>
            <li>2. Add a <strong className="text-foreground">Webhooks by Zapier</strong> action and choose <em>POST</em>.</li>
            <li>3. Paste the webhook URL above into the URL field.</li>
            <li>4. Set the <em>Payload type</em> to <strong className="text-foreground">JSON</strong> and add these fields:</li>
            <li className="ml-4">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">title</code> — the note title (e.g. respondent name or form name)
            </li>
            <li className="ml-4">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">content</code> — the body text (e.g. form answers)
            </li>
            <li>5. Turn on the Zap. Each trigger will create a new note in <strong className="text-foreground">{integration.project.name}</strong>.</li>
          </ol>
        </section>

        <section>
          <Text as="p" size={100} weight="medium" className="mb-3">Recent events</Text>
          <IntegrationEventLog events={integration.events} />
        </section>

        <section className="rounded-xl border border-destructive/30 p-5">
          <Text as="p" size={100} weight="medium" className="mb-1">Danger zone</Text>
          <Text as="p" size={75} color="subdued" className="mb-4">
            Deleting this integration will permanently invalidate the webhook URL. This cannot be undone.
          </Text>
          <form action={deleteIntegration.bind(null, integration.id)}>
            <Button type="submit" variant="destructive" size="sm">
              Delete integration
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
