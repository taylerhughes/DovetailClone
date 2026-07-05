import type { FieldType, Prisma } from "@/lib/generated/prisma/client";
import type { FilterRule } from "./types";

/**
 * Structural shape shared by NoteFieldValueWhereInput and
 * InsightFieldValueWhereInput (both value tables have identical columns) so
 * buildFieldValueMatch can serve both entity types without Prisma's nominal
 * per-model types getting in the way.
 */
export type FieldValueMatch = {
  valueText?: { equals?: string; contains?: string; mode?: "insensitive" };
  valueNumber?: { equals?: number; gt?: number; lt?: number };
  valueDate?: { equals?: Date; lt?: Date; gt?: Date };
  teamMemberId?: string | { in: string[] };
  selectedOptions?: { some: { fieldOptionId: { in: string[] } } };
};

/**
 * Builds the inner FieldValue match for a single filter rule, given the
 * type of the field being filtered on. Pure function: no DB access, easy to
 * exhaustively unit test per FieldType x FilterOperator combination.
 */
export function buildFieldValueMatch(
  fieldType: FieldType,
  rule: FilterRule,
): FieldValueMatch {
  switch (fieldType) {
    case "TEXT": {
      if (rule.operator === "equals") {
        return { valueText: { equals: String(rule.value) } };
      }
      if (rule.operator === "contains") {
        return {
          valueText: { contains: String(rule.value), mode: "insensitive" },
        };
      }
      break;
    }
    case "NUMBER": {
      if (rule.operator === "equals") {
        return { valueNumber: { equals: Number(rule.value) } };
      }
      if (rule.operator === "gt") {
        return { valueNumber: { gt: Number(rule.value) } };
      }
      if (rule.operator === "lt") {
        return { valueNumber: { lt: Number(rule.value) } };
      }
      break;
    }
    case "DATE": {
      if (rule.operator === "equals") {
        return { valueDate: { equals: new Date(rule.value as string) } };
      }
      if (rule.operator === "before") {
        return { valueDate: { lt: new Date(rule.value as string) } };
      }
      if (rule.operator === "after") {
        return { valueDate: { gt: new Date(rule.value as string) } };
      }
      break;
    }
    case "PERSON": {
      if (rule.operator === "equals") {
        return { teamMemberId: rule.value as string };
      }
      if (rule.operator === "in") {
        return { teamMemberId: { in: rule.value as string[] } };
      }
      break;
    }
    case "SINGLE_SELECT":
    case "MULTI_SELECT": {
      if (rule.operator === "equals" || rule.operator === "in") {
        const ids = Array.isArray(rule.value) ? rule.value : [rule.value];
        return {
          selectedOptions: { some: { fieldOptionId: { in: ids as string[] } } },
        };
      }
      break;
    }
  }

  throw new Error(
    `Unsupported filter operator "${rule.operator}" for field type "${fieldType}"`,
  );
}

/**
 * Turns a single filter rule into a top-level NoteWhereInput fragment.
 * "isEmpty" needs `none` rather than `some`, so it's handled before
 * delegating to buildFieldValueMatch.
 */
export function buildNoteFilterClause(
  fieldType: FieldType,
  rule: FilterRule,
): Prisma.NoteWhereInput {
  if (rule.operator === "isEmpty") {
    return { fieldValues: { none: { fieldId: rule.fieldId } } };
  }
  return {
    fieldValues: {
      some: {
        fieldId: rule.fieldId,
        ...buildFieldValueMatch(fieldType, rule),
      } as Prisma.NoteFieldValueWhereInput,
    },
  };
}

/**
 * Combines a project scope with a set of filter rules (each resolved against
 * its field's type) into a single Prisma NoteWhereInput.
 */
export function buildNoteWhere(
  projectId: string,
  rules: FilterRule[],
  fieldTypesById: Map<string, FieldType>,
): Prisma.NoteWhereInput {
  const clauses = rules
    .filter((rule) => fieldTypesById.has(rule.fieldId))
    .map((rule) => buildNoteFilterClause(fieldTypesById.get(rule.fieldId)!, rule));

  return clauses.length > 0 ? { projectId, AND: clauses } : { projectId };
}

/** Same as buildNoteFilterClause but for Insight's fieldValues relation. */
export function buildInsightFilterClause(
  fieldType: FieldType,
  rule: FilterRule,
): Prisma.InsightWhereInput {
  if (rule.operator === "isEmpty") {
    return { fieldValues: { none: { fieldId: rule.fieldId } } };
  }
  return {
    fieldValues: {
      some: {
        fieldId: rule.fieldId,
        ...buildFieldValueMatch(fieldType, rule),
      } as Prisma.InsightFieldValueWhereInput,
    },
  };
}

/** Same as buildNoteWhere but for the Insight entity. */
export function buildInsightWhere(
  projectId: string,
  rules: FilterRule[],
  fieldTypesById: Map<string, FieldType>,
): Prisma.InsightWhereInput {
  const clauses = rules
    .filter((rule) => fieldTypesById.has(rule.fieldId))
    .map((rule) => buildInsightFilterClause(fieldTypesById.get(rule.fieldId)!, rule));

  return clauses.length > 0 ? { projectId, AND: clauses } : { projectId };
}
