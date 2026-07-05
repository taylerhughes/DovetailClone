import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { RedeemShareLinkButton } from "@/components/projects/RedeemShareLinkButton";

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
        <p className="text-sm text-muted-foreground">
          This share link is invalid or has been disabled.
        </p>
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
        <span className="text-xs font-medium text-muted-foreground">
          Shared project
        </span>
        <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
      </div>

      {user ? (
        <RedeemShareLinkButton token={token} role={project.shareLinkRole} />
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/sign-up" className="text-primary hover:underline">
            create an account
          </Link>
          , then revisit this link to get{" "}
          {project.shareLinkRole === "EDITOR" ? "edit" : "view"} access.
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Notes ({project.notes.length})
        </h2>
        <div className="flex flex-col gap-1.5">
          {project.notes.map((note) => (
            <div key={note.id} className="rounded-md border p-3">
              <p className="text-sm font-medium">{note.title}</p>
              {note.plainText && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {note.plainText}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Highlights ({highlights.length})
        </h2>
        <div className="flex flex-col gap-1.5">
          {highlights.map((h) => (
            <div key={h.id} className="rounded-md border p-3 text-sm">
              &ldquo;{h.quote}&rdquo;
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Insights ({project.insights.length})
        </h2>
        <div className="flex flex-col gap-1.5">
          {project.insights.map((insight) => (
            <div key={insight.id} className="rounded-md border p-3">
              <p className="text-sm font-medium">{insight.title}</p>
              {insight.plainText && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {insight.plainText}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
