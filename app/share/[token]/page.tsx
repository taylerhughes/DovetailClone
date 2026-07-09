import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { RedeemShareLinkButton } from "@/components/projects/RedeemShareLinkButton";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default async function SharedProjectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser();

  const project = await db.project.findUnique({
    where: { shareLinkToken: token },
    select: {
      id: true,
      name: true,
      description: true,
      shareLinkEnabled: true,
      shareLinkRole: true,
      notes: {
        select: { id: true, title: true, plainText: true },
        orderBy: { updatedAt: "desc" },
        take: 50,
      },
      insights: {
        select: { id: true, title: true, plainText: true },
        orderBy: { updatedAt: "desc" },
        take: 50,
      },
    },
  });

  // Re-check shareLinkEnabled live, not just that the token still matches a
  // row -- otherwise disabling the link would do nothing for a still-
  // bookmarked or forwarded URL.
  if (!project || !project.shareLinkEnabled) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Text size={100} color="subdued">This share link is invalid or has been disabled.</Text>
      </div>
    );
  }

  const highlights = await db.highlight.findMany({
    where: { note: { projectId: project.id } },
    select: { id: true, quote: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <Text as="span" size={75} weight="medium" color="subdued">Shared project</Text>
        <Heading level={1} size={700}>{project.name}</Heading>
        {project.description && (
          <Text size={100} color="subdued">{project.description}</Text>
        )}
      </div>

      {user ? (
        <RedeemShareLinkButton token={token} role={project.shareLinkRole} />
      ) : (
        <Text size={100} color="subdued">
          <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link>{" "}
          or{" "}
          <Link href="/sign-up" className="text-primary hover:underline">create an account</Link>
          , then revisit this link to get{" "}
          {project.shareLinkRole === "EDITOR" ? "edit" : "view"} access.
        </Text>
      )}

      <section className="flex flex-col gap-2">
        <Heading level={2} size={75} color="subdued">Notes ({project.notes.length})</Heading>
        <div className="flex flex-col gap-1.5">
          {project.notes.map((note) => (
            <div key={note.id} className="rounded-md border p-3">
              <Text size={100} weight="medium">{note.title}</Text>
              {note.plainText && (
                <Text size={75} color="subdued" className="mt-1 line-clamp-2">{note.plainText}</Text>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Heading level={2} size={75} color="subdued">Tags ({highlights.length})</Heading>
        <div className="flex flex-col gap-1.5">
          {highlights.map((h) => (
            <div key={h.id} className="rounded-md border p-3">
              <Text size={100}>&ldquo;{h.quote}&rdquo;</Text>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Heading level={2} size={75} color="subdued">Insights ({project.insights.length})</Heading>
        <div className="flex flex-col gap-1.5">
          {project.insights.map((insight) => (
            <div key={insight.id} className="rounded-md border p-3">
              <Text size={100} weight="medium">{insight.title}</Text>
              {insight.plainText && (
                <Text size={75} color="subdued" className="mt-1 line-clamp-2">{insight.plainText}</Text>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
