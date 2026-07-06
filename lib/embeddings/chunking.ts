const DEFAULT_MAX_CHARS = 1600;

/**
 * Splits plain text into chunks along the paragraph breaks docToPlainText
 * already inserts, coalescing adjacent short paragraphs up to maxChars. No
 * overlap logic -- notes/insights aren't long enough at this app's scale to
 * need sliding-window context preservation across chunk boundaries.
 */
export function chunkPlainText(
  plainText: string,
  maxChars: number = DEFAULT_MAX_CHARS,
): string[] {
  const trimmed = plainText.trim();
  if (!trimmed) return [];

  const paragraphs = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return [];

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > maxChars && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}
