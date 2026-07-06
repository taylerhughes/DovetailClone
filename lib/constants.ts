/** Cap for unbounded list queries (project list, Data/Highlights/Insights). Grid/Board/Table sort and group in-memory after fetching, so this is a pragmatic bound rather than true pagination. */
export const LIST_RESULT_CAP = 200;

/** Cap on highlights sent to the theme-clustering AI call, bounding token cost/latency rather than a UI list. */
export const THEME_CLUSTERING_HIGHLIGHT_CAP = 250;
