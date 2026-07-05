export type FilterOperator =
  | "equals"
  | "contains"
  | "in"
  | "gt"
  | "lt"
  | "before"
  | "after"
  | "isEmpty";

export interface FilterRule {
  fieldId: string;
  operator: FilterOperator;
  value?: unknown;
}

export type SortDirection = "asc" | "desc";
