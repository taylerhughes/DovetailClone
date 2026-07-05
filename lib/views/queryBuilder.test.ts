import { describe, expect, it } from "vitest";
import {
  buildFieldValueMatch,
  buildNoteFilterClause,
  buildNoteWhere,
} from "./queryBuilder";

describe("buildFieldValueMatch", () => {
  it("TEXT equals", () => {
    expect(buildFieldValueMatch("TEXT", { fieldId: "f", operator: "equals", value: "hi" })).toEqual({
      valueText: { equals: "hi" },
    });
  });

  it("TEXT contains", () => {
    expect(
      buildFieldValueMatch("TEXT", { fieldId: "f", operator: "contains", value: "hi" }),
    ).toEqual({ valueText: { contains: "hi", mode: "insensitive" } });
  });

  it("NUMBER gt/lt/equals", () => {
    expect(buildFieldValueMatch("NUMBER", { fieldId: "f", operator: "gt", value: 3 })).toEqual({
      valueNumber: { gt: 3 },
    });
    expect(buildFieldValueMatch("NUMBER", { fieldId: "f", operator: "lt", value: 3 })).toEqual({
      valueNumber: { lt: 3 },
    });
    expect(
      buildFieldValueMatch("NUMBER", { fieldId: "f", operator: "equals", value: 3 }),
    ).toEqual({ valueNumber: { equals: 3 } });
  });

  it("DATE before/after/equals", () => {
    const iso = "2026-01-01";
    expect(buildFieldValueMatch("DATE", { fieldId: "f", operator: "before", value: iso })).toEqual({
      valueDate: { lt: new Date(iso) },
    });
    expect(buildFieldValueMatch("DATE", { fieldId: "f", operator: "after", value: iso })).toEqual({
      valueDate: { gt: new Date(iso) },
    });
  });

  it("PERSON equals/in", () => {
    expect(
      buildFieldValueMatch("PERSON", { fieldId: "f", operator: "equals", value: "u1" }),
    ).toEqual({ teamMemberId: "u1" });
    expect(
      buildFieldValueMatch("PERSON", { fieldId: "f", operator: "in", value: ["u1", "u2"] }),
    ).toEqual({ teamMemberId: { in: ["u1", "u2"] } });
  });

  it("SINGLE_SELECT / MULTI_SELECT equals wraps a single value into `in`", () => {
    expect(
      buildFieldValueMatch("SINGLE_SELECT", { fieldId: "f", operator: "equals", value: "opt1" }),
    ).toEqual({ selectedOptions: { some: { fieldOptionId: { in: ["opt1"] } } } });
    expect(
      buildFieldValueMatch("MULTI_SELECT", {
        fieldId: "f",
        operator: "in",
        value: ["opt1", "opt2"],
      }),
    ).toEqual({ selectedOptions: { some: { fieldOptionId: { in: ["opt1", "opt2"] } } } });
  });

  it("throws for an operator unsupported by the field type", () => {
    expect(() =>
      buildFieldValueMatch("TEXT", { fieldId: "f", operator: "gt", value: 1 }),
    ).toThrow(/Unsupported/);
    expect(() =>
      buildFieldValueMatch("PERSON", { fieldId: "f", operator: "contains", value: "x" }),
    ).toThrow(/Unsupported/);
  });
});

describe("buildNoteFilterClause", () => {
  it("isEmpty uses `none` regardless of field type", () => {
    expect(buildNoteFilterClause("TEXT", { fieldId: "f1", operator: "isEmpty" })).toEqual({
      fieldValues: { none: { fieldId: "f1" } },
    });
  });

  it("non-empty operators wrap the match in a `some`", () => {
    expect(
      buildNoteFilterClause("NUMBER", { fieldId: "f1", operator: "gt", value: 5 }),
    ).toEqual({
      fieldValues: { some: { fieldId: "f1", valueNumber: { gt: 5 } } },
    });
  });
});

describe("buildNoteWhere", () => {
  it("returns just the projectId scope when there are no rules", () => {
    expect(buildNoteWhere("p1", [], new Map())).toEqual({ projectId: "p1" });
  });

  it("combines multiple rules with AND, resolving each field's type", () => {
    const fieldTypes = new Map([
      ["f1", "NUMBER" as const],
      ["f2", "SINGLE_SELECT" as const],
    ]);
    const result = buildNoteWhere(
      "p1",
      [
        { fieldId: "f1", operator: "gt", value: 1 },
        { fieldId: "f2", operator: "equals", value: "opt1" },
      ],
      fieldTypes,
    );
    expect(result).toEqual({
      projectId: "p1",
      AND: [
        { fieldValues: { some: { fieldId: "f1", valueNumber: { gt: 1 } } } },
        {
          fieldValues: {
            some: { fieldId: "f2", selectedOptions: { some: { fieldOptionId: { in: ["opt1"] } } } },
          },
        },
      ],
    });
  });

  it("silently drops rules referencing a field that no longer exists", () => {
    const result = buildNoteWhere(
      "p1",
      [{ fieldId: "deleted-field", operator: "equals", value: "x" }],
      new Map(),
    );
    expect(result).toEqual({ projectId: "p1" });
  });
});
