import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { db } from "@/lib/db";
import { Text } from "@/components/ui/text";
import { InsightEditor } from "@/components/editor/InsightEditor";
import { InsightTitle } from "@/components/insights/InsightTitle";
import { InsightActions } from "@/components/insights/InsightActions";
import { InsightConflictBanner } from "@/components/insights/InsightConflictBanner";
import { CheckConflictsButton } from "@/components/insights/CheckConflictsButton";
import { FieldEditorCell } from "@/components/fields/FieldEditorCell";
import { setInsightFieldValue } from "@/actions/insightFieldValues";
import { isAiEnabled } from "@/lib/ai/client";
import { isEmbeddingsEnabled } from "@/lib/embeddings/client";
import type { HighlightEmbedData } from "@/components/editor/HighlightDataContext";
import type { PickableHighlight } from "@/components/editor/HighlightPickerDialog";

const SEVERITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; insightId: string }>;
}) {
  const { projectId, insightId } = await params;

  const [insight, allHighlights, fields, teamMembers] = await Promise.all([
    db.insight.findUnique({
      where: { id: insightId },
      include: { fieldValues: { include: { selectedOptions: true } } },
    }),
    db.highlight.findMany({
      where: { note: { projectId } },
      orderBy: { createdAt: "desc" },
      include: {
        note: { select: { id: true, title: true } },
        tagAssignments: { include: { tag: true } },
      },
    }),
    db.field.findMany({
      where: { projectId, appliesTo: { in: ["INSIGHT", "BOTH"] } },
      orderBy: { order: "asc" },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    db.teamMember.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
  ]);

  if (!insight) {
    notFound();
  }

  const conflicts = await db.insightConflict.findMany({
    where: { insightId, dismissed: false },
    orderBy: { createdAt: "desc" },
  });
  const conflictHighlightIds = conflicts
    .filter((c) => c.conflictingType === "HIGHLIGHT")
    .map((c) => c.conflictingId);
  const conflictInsightIds = conflicts
    .filter((c) => c.conflictingType === "INSIGHT")
    .map((c) => c.conflictingId);
  const [conflictingHighlights, conflictingInsights] = await Promise.all([
    conflictHighlightIds.length
      ? db.highlight.findMany({
          where: { id: { in: conflictHighlightIds } },
          select: { id: true, quote: true, note: { select: { id: true, projectId: true } } },
        })
      : [],
    conflictInsightIds.length
      ? db.insight.findMany({
          where: { id: { in: conflictInsightIds } },
          select: { id: true, title: true, projectId: true },
        })
      : [],
  ]);
  const conflictingHighlightById = new Map(conflictingHighlights.map((h) => [h.id, h]));
  const conflictingInsightById = new Map(conflictingInsights.map((i) => [i.id, i]));

  const conflictViews = conflicts
    .map((c) => {
      if (c.conflictingType === "HIGHLIGHT") {
        const h = conflictingHighlightById.get(c.conflictingId);
        if (!h) return null;
        return {
          id: c.id,
          severity: c.severity,
          explanation: c.explanation,
          sourceTitle: `"${h.quote}"`,
          href: `/projects/${h.note.projectId}/data/${h.note.id}`,
        };
      }
      const i = conflictingInsightById.get(c.conflictingId);
      if (!i) return null;
      return {
        id: c.id,
        severity: c.severity,
        explanation: c.explanation,
        sourceTitle: i.title,
        href: `/projects/${i.projectId}/insights/${i.id}`,
      };
    })
    .filter((c) => c != null)
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  const toEmbedData = (h: (typeof allHighlights)[number]): HighlightEmbedData => ({
    quote: h.quote,
    wholeNote: h.wholeNote,
    noteId: h.note.id,
    noteTitle: h.note.title,
    tags: h.tagAssignments.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
      color: t.tag.color,
    })),
  });

  const availableHighlights: PickableHighlight[] = allHighlights.map((h) => ({
    id: h.id,
    ...toEmbedData(h),
  }));

  const initialHighlightsById = new Map(
    allHighlights.map((h) => [h.id, toEmbedData(h)]),
  );

  const valuesByFieldId = new Map(insight.fieldValues.map((v) => [v.fieldId, v]));

  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <InsightTitle insightId={insight.id} initialTitle={insight.title} />
        </div>
        {isAiEnabled() && isEmbeddingsEnabled() && (
          <CheckConflictsButton insightId={insight.id} />
        )}
        <InsightActions insightId={insight.id} />
      </div>

      {conflictViews.length > 0 && (
        <div className="flex flex-col gap-2">
          {conflictViews.map((c) => (
            <InsightConflictBanner
              key={c.id}
              conflictId={c.id}
              severity={c.severity}
              explanation={c.explanation}
              href={c.href}
              sourceTitle={c.sourceTitle}
            />
          ))}
        </div>
      )}

      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-3">
          {fields.map((field) => {
            const fv = valuesByFieldId.get(field.id);
            return (
              <div key={field.id} className="flex flex-col gap-1">
                <Text as="span" size={75} color="subdued">{field.name}</Text>
                <FieldEditorCell
                  type={field.type}
                  options={field.options}
                  teamMembers={teamMembers}
                  onSubmit={setInsightFieldValue.bind(null, insight.id, field.id)}
                  value={{
                    valueText: fv?.valueText ?? null,
                    valueNumber: fv?.valueNumber ?? null,
                    valueDate: fv?.valueDate
                      ? fv.valueDate.toISOString().slice(0, 10)
                      : null,
                    teamMemberId: fv?.teamMemberId ?? null,
                    selectedOptionIds:
                      fv?.selectedOptions.map((o) => o.fieldOptionId) ?? [],
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <InsightEditor
        insightId={insight.id}
        initialContent={insight.content as JSONContent}
        initialHighlightsById={initialHighlightsById}
        availableHighlights={availableHighlights}
      />
    </div>
  );
}
