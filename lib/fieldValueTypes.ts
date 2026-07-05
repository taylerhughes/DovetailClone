export type FieldValueInput =
  | { kind: "TEXT"; value: string }
  | { kind: "NUMBER"; value: number | null }
  | { kind: "DATE"; value: string | null }
  | { kind: "SINGLE_SELECT"; optionId: string | null }
  | { kind: "MULTI_SELECT"; optionId: string; checked: boolean }
  | { kind: "PERSON"; teamMemberId: string | null };
