import { db } from "@/lib/db";
import type { CanvasCard } from "@/components/views/CanvasView";
import type { CanvasCandidate } from "@/components/views/canvas/AddToCanvasPanel";

export async function getCanvasData(
  projectId: string,
  viewId: string,
): Promise<{ cards: CanvasCard[]; candidates: CanvasCandidate[] }> {
  const [positions, notes, highlights, insights] = await Promise.all([
    db.canvasCardPosition.findMany({ where: { viewId } }),
    db.note.findMany({ where: { projectId }, select: { id: true, title: true, plainText: true } }),
    db.highlight.findMany({
      where: { note: { projectId } },
      select: { id: true, quote: true, note: { select: { id: true, title: true } } },
    }),
    db.insight.findMany({ where: { projectId }, select: { id: true, title: true, plainText: true } }),
  ]);

  const noteById = new Map(notes.map((n) => [n.id, n]));
  const highlightById = new Map(highlights.map((h) => [h.id, h]));
  const insightById = new Map(insights.map((i) => [i.id, i]));

  function toCard(
    subjectType: "NOTE" | "HIGHLIGHT" | "INSIGHT",
    subjectId: string,
  ): { href: string; title: string; subtitle: string } | null {
    if (subjectType === "NOTE") {
      const note = noteById.get(subjectId);
      if (!note) return null;
      return {
        href: `/projects/${projectId}/data/${note.id}`,
        title: note.title,
        subtitle: note.plainText,
      };
    }
    if (subjectType === "INSIGHT") {
      const insight = insightById.get(subjectId);
      if (!insight) return null;
      return {
        href: `/projects/${projectId}/insights/${insight.id}`,
        title: insight.title,
        subtitle: insight.plainText,
      };
    }
    const highlight = highlightById.get(subjectId);
    if (!highlight) return null;
    return {
      href: `/projects/${projectId}/data/${highlight.note.id}`,
      title: `"${highlight.quote}"`,
      subtitle: `From: ${highlight.note.title}`,
    };
  }

  const cards: CanvasCard[] = [];
  for (const pos of positions) {
    const info = toCard(pos.subjectType, pos.subjectId);
    if (!info) continue;
    cards.push({ subjectType: pos.subjectType, subjectId: pos.subjectId, x: pos.x, y: pos.y, ...info });
  }

  const placed = new Set(positions.map((p) => `${p.subjectType}:${p.subjectId}`));

  const candidates: CanvasCandidate[] = [
    ...notes
      .filter((n) => !placed.has(`NOTE:${n.id}`))
      .map((n) => ({ id: n.id, kind: "NOTE" as const, title: n.title, subtitle: n.plainText })),
    ...highlights
      .filter((h) => !placed.has(`HIGHLIGHT:${h.id}`))
      .map((h) => ({
        id: h.id,
        kind: "HIGHLIGHT" as const,
        title: `"${h.quote}"`,
        subtitle: `From: ${h.note.title}`,
      })),
    ...insights
      .filter((i) => !placed.has(`INSIGHT:${i.id}`))
      .map((i) => ({ id: i.id, kind: "INSIGHT" as const, title: i.title, subtitle: i.plainText })),
  ];

  return { cards, candidates };
}
