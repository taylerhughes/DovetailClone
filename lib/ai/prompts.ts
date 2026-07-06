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

export function summarizeNoteUserPrompt(text: string): string {
  return `Summarize the following research note in 2-4 sentences, focusing on what the participant said or did and any notable pain points:\n\n${text}`;
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
