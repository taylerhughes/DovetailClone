/**
 * Per-user request budgets for authenticated routes Better Auth doesn't
 * cover. AI/embeddings calls hit paid third-party APIs, so limits here
 * bound both cost and abuse potential; upload limits bound storage abuse.
 * Tune freely — these are starting defaults, not load-tested ceilings.
 */
export const RATE_LIMITS = {
  aiLight: { max: 30, windowSec: 60 }, // suggest-tags, summarize-note
  aiHeavy: { max: 10, windowSec: 60 }, // draft-insight, generate-themes, check-conflicts
  aiChat: { max: 20, windowSec: 60 }, // ask
  upload: { max: 30, windowSec: 600 },
} as const;
