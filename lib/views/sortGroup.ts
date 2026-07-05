import type { FieldType } from "@/lib/generated/prisma/client";
import type { SortDirection } from "./types";

export interface FieldValueLike {
  fieldId: string;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: Date | null;
  teamMemberId: string | null;
  selectedOptions: { fieldOptionId: string }[];
}

function comparableValue(fieldType: FieldType, fv: FieldValueLike | undefined) {
  if (!fv) return null;
  switch (fieldType) {
    case "TEXT":
      return fv.valueText;
    case "NUMBER":
      return fv.valueNumber;
    case "DATE":
      return fv.valueDate ? fv.valueDate.getTime() : null;
    case "PERSON":
      return fv.teamMemberId;
    case "SINGLE_SELECT":
    case "MULTI_SELECT":
      return fv.selectedOptions[0]?.fieldOptionId ?? null;
  }
}

/** Sorts a list of records (each with a `fieldValues` array) in place-safe fashion by a given field. Records with no value sort last. */
export function sortByField<T extends { fieldValues: FieldValueLike[] }>(
  records: T[],
  fieldId: string,
  fieldType: FieldType,
  direction: SortDirection,
): T[] {
  const withValue = (r: T) =>
    comparableValue(fieldType, r.fieldValues.find((fv) => fv.fieldId === fieldId));

  return [...records].sort((a, b) => {
    const va = withValue(a);
    const vb = withValue(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    if (va < vb) return direction === "asc" ? -1 : 1;
    if (va > vb) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

export interface GroupColumn<T> {
  key: string;
  label: string;
  color: string | null;
  records: T[];
}

/**
 * Groups records by a select/person field into columns. A record with no
 * value for the field lands in a synthetic "Uncategorized" column. A
 * MULTI_SELECT value with several options places the record into every
 * matching column (fan-out), matching a kanban board's usual semantics.
 */
export function groupByField<T extends { fieldValues: FieldValueLike[] }>(
  records: T[],
  fieldId: string,
  fieldType: Extract<FieldType, "SINGLE_SELECT" | "MULTI_SELECT" | "PERSON">,
  options: { id: string; label: string; color: string }[],
  teamMembers: { id: string; name: string; color: string }[],
): GroupColumn<T>[] {
  const groupDefs =
    fieldType === "PERSON"
      ? teamMembers.map((m) => ({ key: m.id, label: m.name, color: m.color }))
      : options.map((o) => ({ key: o.id, label: o.label, color: o.color }));

  const columns = new Map<string, GroupColumn<T>>(
    groupDefs.map((g) => [g.key, { ...g, records: [] }]),
  );
  const uncategorized: GroupColumn<T> = {
    key: "__uncategorized__",
    label: "Uncategorized",
    color: null,
    records: [],
  };

  for (const record of records) {
    const fv = record.fieldValues.find((v) => v.fieldId === fieldId);
    const keys =
      fieldType === "PERSON"
        ? fv?.teamMemberId
          ? [fv.teamMemberId]
          : []
        : (fv?.selectedOptions.map((o) => o.fieldOptionId) ?? []);

    if (keys.length === 0) {
      uncategorized.records.push(record);
      continue;
    }
    for (const key of keys) {
      columns.get(key)?.records.push(record);
    }
  }

  return [...columns.values(), uncategorized];
}
