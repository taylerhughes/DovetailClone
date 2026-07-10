import Link from "next/link";
import { db } from "@/lib/db";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import type { JSONContent } from "@tiptap/react";

function renderDoc(doc: JSONContent): string {
  if (!doc?.content) return "";
  return doc.content
    .map((node) => {
      if (node.type === "paragraph") {
        return (node.content ?? []).map((c) => c.text ?? "").join("") + "\n\n";
      }
      if (node.type === "heading") {
        return (node.content ?? []).map((c) => c.text ?? "").join("") + "\n\n";
      }
      return "";
    })
    .join("")
    .trim();
}

export default async function SharedNotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const note = await db.note.findUnique({
    where: { shareLinkToken: token },
    select: {
      id: true,
      title: true,
      content: true,
      plainText: true,
      shareLinkEnabled: true,
      project: { select: { id: true, name: true } },
      highlights: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          quote: true,
          tagAssignments: { select: { tag: { select: { name: true, color: true } } } },
        },
      },
    },
  });

  if (!note || !note.shareLinkEnabled) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Text size={100} color="subdued">This share link is invalid or has been disabled.</Text>
      </div>
    );
  }

  const plainText = note.plainText || renderDoc(note.content as JSONContent);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <Link
          href={`/share/note/${token}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          {note.project.name}
        </Link>
        <Heading level={1} size={700}>{note.title}</Heading>
      </div>

      {plainText && (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {plainText}
        </div>
      )}

      {note.highlights.length > 0 && (
        <section className="flex flex-col gap-2 border-t pt-6">
          <Heading level={2} size={75} color="subdued">
            Tags ({note.highlights.length})
          </Heading>
          <div className="flex flex-col gap-2">
            {note.highlights.map((h) => (
              <div key={h.id} className="rounded-md border p-3">
                <Text size={100}>&ldquo;{h.quote}&rdquo;</Text>
                {h.tagAssignments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {h.tagAssignments.map(({ tag }) => (
                      <span
                        key={tag.name}
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: tag.color ? `${tag.color}22` : undefined,
                          color: tag.color ?? undefined,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
