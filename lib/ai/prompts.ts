export function suggestTagsSystemPrompt(): string {
  return "You are a UX research assistant. You suggest existing tags that best describe a piece of research data. Only suggest tags from the provided list; never invent new tag names.";
}

export function suggestTagsUserPrompt(
  text: string,
  existingTagNames: string[],
): string {
  return [
    `Existing tags in this project: ${existingTagNames.join(", ") || "(none yet)"}`,
    "",
    "Text to tag:",
    text,
    "",
    "Suggest up to 5 of the existing tags above that best apply, with a confidence between 0 and 1. If none apply well, return an empty list.",
  ].join("\n");
}

export function summarizeNoteSystemPrompt(): string {
  return "You are a UX research assistant. You write concise, neutral summaries of raw research notes for a busy stakeholder.";
}

export function summarizeNoteUserPrompt(text: string, existingTagNames: string[]): string {
  const tagSection = existingTagNames.length > 0
    ? [
        "Existing tags in this project (prefer these before creating new ones):",
        existingTagNames.map((t) => `  - ${t}`).join("\n"),
      ].join("\n")
    : "Existing tags in this project: (none yet — create sensible new ones)";

  return [
    "Summarize the following research note for a stakeholder.",
    "",
    "Step 1 — Highlights: Identify 3-8 key verbatim quotes from the note that are most worth highlighting (direct quotes, important findings, notable moments). For each highlight, suggest exactly 1 tag name — only suggest 2 if the quote genuinely spans two completely distinct research themes and a single tag would be misleading.",
    "",
    "Tag naming rules:",
    "- FIRST check the existing tag list below and reuse any tag that genuinely fits",
    "- If you suggest the same concept for multiple highlights, use the exact same tag name each time — consistency matters",
    "- Only create a new tag name if nothing in the existing list fits — new tags should be short (1-3 words), lowercase, descriptive of a research theme (e.g. 'navigation', 'onboarding friction', 'trust')",
    "- Never invent generic or placeholder names like 'test', 'tag', 'highlight', 'note', or 'misc'",
    "- Prefer 1 tag per highlight. Do not pad with extra tags.",
    "- Copy the quote exactly as it appears in the note (verbatim, no paraphrasing)",
    "",
    tagSection,
    "",
    "Step 2 — Chapters: If the transcript covers distinct topics in sequence (like a structured interview with different question areas, or a usability test with different tasks), identify 2-6 chapters. Each chapter should have a short title (3-6 words describing what is discussed) and the startSec of the first transcript segment where that topic begins. Skip this step and return an empty chapters array if the transcript is short, unstructured, or doesn't have clear topic shifts.",
    "",
    "Step 3 — Summary: Write 2-4 short paragraphs covering:",
    "1. What the session was about and who the participant was (if known)",
    "2. The main things the participant said, did, or felt",
    "3. Any notable pain points, needs, or surprises",
    "",
    "For each paragraph, include the 0-based indices of the highlights (from Step 1) that support it in citedHighlightIndices. Be concise and neutral. Do not use bullet points or headings inside paragraphs.",
    "",
    "Note:",
    text,
  ].join("\n");
}

export function draftInsightSystemPrompt(): string {
  return "You are a UX research assistant. You synthesize a set of tagged highlights from user research into a short, structured insight write-up for stakeholders.";
}

export function draftInsightUserPrompt(
  highlights: { id: string; quote: string; tags: string[] }[],
): string {
  const list = highlights
    .map((h) => `- [${h.id}] "${h.quote}" (tags: ${h.tags.join(", ") || "none"})`)
    .join("\n");

  return [
    "Here are highlights selected from user research:",
    list,
    "",
    "Write a short insight title and 2-4 short paragraphs synthesizing the pattern across these highlights.",
    "For each paragraph, list the ids of the highlights (from the brackets above) that support it, so they can be cited inline.",
  ].join("\n");
}

export function generateThemesSystemPrompt(): string {
  return "You are a UX research assistant. You group a project's highlights into a handful of synthesized themes based on their content, not just their existing tags. Theme titles should be short and descriptive, distinct from any existing tag name.";
}

export function generateThemesUserPrompt(
  highlights: { id: string; quote: string; tags: string[] }[],
): string {
  const list = highlights
    .map((h) => `- [${h.id}] "${h.quote}" (tags: ${h.tags.join(", ") || "none"})`)
    .join("\n");

  return [
    "Here are all the highlights in this project:",
    list,
    "",
    "Group these highlights into 3-8 themes. Each theme should have a short title, a 1-2 sentence description of the pattern it captures, and the ids of the highlights (from the brackets above) that belong to it.",
    "A highlight may belong to more than one theme, or to none if it doesn't fit any clear pattern. Only include highlights that genuinely support each theme.",
  ].join("\n");
}

export function askResearchSystemPrompt(): string {
  return "You are a UX research assistant. You answer questions about a user's research repository using only the provided excerpts from their notes, highlights, and insights. Cite every claim you make. If the excerpts don't cover the question, say you don't have enough information rather than guessing.";
}

export interface AskResearchCandidate {
  subjectType: "NOTE" | "HIGHLIGHT" | "INSIGHT";
  subjectId: string;
  text: string;
}

export function detectConflictsSystemPrompt(): string {
  return "You are a UX research assistant. You compare an existing insight's claims against other evidence from the same project's research repository, and flag anything that contradicts, undermines, or supersedes the insight. Only flag genuine contradictions or meaningful updates -- do not flag evidence that's merely unrelated or that simply supports the insight further. If nothing conflicts, return an empty list.";
}

export interface ConflictCandidate {
  subjectType: "HIGHLIGHT" | "INSIGHT";
  subjectId: string;
  text: string;
}

export function detectConflictsUserPrompt(
  insightTitle: string,
  insightText: string,
  candidates: ConflictCandidate[],
): string {
  const list = candidates
    .map((c) => `- [${c.subjectType}:${c.subjectId}] "${c.text}"`)
    .join("\n");

  return [
    `Existing insight: "${insightTitle}"`,
    insightText,
    "",
    "Other evidence from this project's research repository:",
    list || "(none found)",
    "",
    "Which of the excerpts above, if any, contradict, undermine, or meaningfully update the existing insight? For each, give a severity (LOW, MEDIUM, or HIGH) and a short explanation of the conflict.",
  ].join("\n");
}

export function askResearchUserPrompt(
  question: string,
  history: { role: "user" | "assistant"; content: string }[],
  candidates: AskResearchCandidate[],
): string {
  const excerpts = candidates
    .map((c) => `- [${c.subjectType}:${c.subjectId}] "${c.text}"`)
    .join("\n");

  const historyText = history.length
    ? [
        "Prior conversation turns:",
        ...history.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`),
        "",
      ]
    : [];

  return [
    ...historyText,
    "Relevant excerpts from the research repository:",
    excerpts || "(none found)",
    "",
    `Question: ${question}`,
    "",
    "Answer the question using only the excerpts above. For each claim, cite the excerpt(s) it's drawn from using their [subjectType:subjectId] labels.",
  ].join("\n");
}
