import { describe, expect, it } from "vitest";
import { sortByField, groupByField, type FieldValueLike } from "./sortGroup";

function fv(overrides: Partial<FieldValueLike> & { fieldId: string }): FieldValueLike {
  return {
    valueText: null,
    valueNumber: null,
    valueDate: null,
    teamMemberId: null,
    selectedOptions: [],
    ...overrides,
  };
}

describe("sortByField", () => {
  it("sorts NUMBER ascending/descending, missing values last", () => {
    const records = [
      { id: "a", fieldValues: [fv({ fieldId: "f", valueNumber: 3 })] },
      { id: "b", fieldValues: [fv({ fieldId: "f", valueNumber: 1 })] },
      { id: "c", fieldValues: [] },
      { id: "d", fieldValues: [fv({ fieldId: "f", valueNumber: 2 })] },
    ];
    expect(sortByField(records, "f", "NUMBER", "asc").map((r) => r.id)).toEqual([
      "b",
      "d",
      "a",
      "c",
    ]);
    expect(sortByField(records, "f", "NUMBER", "desc").map((r) => r.id)).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("does not mutate the input array", () => {
    const records = [
      { id: "a", fieldValues: [fv({ fieldId: "f", valueNumber: 2 })] },
      { id: "b", fieldValues: [fv({ fieldId: "f", valueNumber: 1 })] },
    ];
    const copy = [...records];
    sortByField(records, "f", "NUMBER", "asc");
    expect(records).toEqual(copy);
  });
});

describe("groupByField", () => {
  it("fans a MULTI_SELECT record out into every matching column", () => {
    const options = [
      { id: "o1", label: "Onboarding", color: "#fff" },
      { id: "o2", label: "Navigation", color: "#000" },
    ];
    const records = [
      {
        id: "a",
        fieldValues: [
          fv({ fieldId: "f", selectedOptions: [{ fieldOptionId: "o1" }, { fieldOptionId: "o2" }] }),
        ],
      },
      { id: "b", fieldValues: [fv({ fieldId: "f", selectedOptions: [{ fieldOptionId: "o1" }] })] },
      { id: "c", fieldValues: [] },
    ];
    const groups = groupByField(records, "f", "MULTI_SELECT", options, []);
    const byKey = Object.fromEntries(groups.map((g) => [g.key, g.records.map((r) => r.id)]));
    expect(byKey.o1).toEqual(["a", "b"]);
    expect(byKey.o2).toEqual(["a"]);
    expect(byKey.__uncategorized__).toEqual(["c"]);
  });

  it("groups PERSON by teamMemberId with an Uncategorized fallback", () => {
    const members = [
      { id: "u1", name: "Alice", color: "#fff" },
      { id: "u2", name: "Bob", color: "#000" },
    ];
    const records = [
      { id: "a", fieldValues: [fv({ fieldId: "f", teamMemberId: "u1" })] },
      { id: "b", fieldValues: [] },
    ];
    const groups = groupByField(records, "f", "PERSON", [], members);
    const byKey = Object.fromEntries(groups.map((g) => [g.key, g.records.map((r) => r.id)]));
    expect(byKey.u1).toEqual(["a"]);
    expect(byKey.u2).toEqual([]);
    expect(byKey.__uncategorized__).toEqual(["b"]);
  });
});
