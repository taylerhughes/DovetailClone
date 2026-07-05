"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { updateViewConfig } from "@/actions/views";
import type { FieldType, ViewLayout } from "@/lib/generated/prisma/client";
import type { FilterOperator, FilterRule } from "@/lib/views/types";

export type FieldOption = { id: string; name: string; type: FieldType };

const GROUPABLE_TYPES: FieldType[] = ["SINGLE_SELECT", "MULTI_SELECT", "PERSON"];

const DEFAULT_OPERATOR: Record<FieldType, FilterOperator> = {
  TEXT: "contains",
  NUMBER: "equals",
  DATE: "equals",
  SINGLE_SELECT: "in",
  MULTI_SELECT: "in",
  PERSON: "in",
};

export function ViewConfigPanel({
  viewId,
  layout,
  fields,
  fieldOptionsById,
  teamMembers,
  groupByFieldId,
  sortFieldId,
  sortDirection,
  filterConfig,
}: {
  viewId: string;
  layout: ViewLayout;
  fields: FieldOption[];
  fieldOptionsById: Map<string, { id: string; label: string }[]>;
  teamMembers: { id: string; name: string }[];
  groupByFieldId: string | null;
  sortFieldId: string | null;
  sortDirection: "asc" | "desc" | null;
  filterConfig: FilterRule[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [newFilterFieldId, setNewFilterFieldId] = useState("");
  const [newFilterValue, setNewFilterValue] = useState("");

  function apply(config: Parameters<typeof updateViewConfig>[1]) {
    startTransition(async () => {
      await updateViewConfig(viewId, config);
      router.refresh();
    });
  }

  const newFilterField = fields.find((f) => f.id === newFilterFieldId);

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" aria-label="View settings" />}
      >
        <Settings2 data-icon="inline-start" />
        Configure
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        {layout === "BOARD" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Group by
            </span>
            <Select
              value={groupByFieldId ?? "__none__"}
              onValueChange={(v) =>
                apply({ groupByFieldId: v === "__none__" ? null : v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) =>
                    v === "__none__"
                      ? "None"
                      : (fields.find((f) => f.id === v)?.name ?? "None")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {fields
                  .filter((f) => GROUPABLE_TYPES.includes(f.type))
                  .map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(layout === "GRID" || layout === "LIST" || layout === "TABLE") && (
          <div className="mt-3 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Sort by
            </span>
            <div className="flex gap-1.5">
              <Select
                value={sortFieldId ?? "__none__"}
                onValueChange={(v) =>
                  apply({
                    sortFieldId: v === "__none__" ? null : v,
                    sortDirection: sortDirection ?? "asc",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string) =>
                      v === "__none__"
                        ? "None"
                        : (fields.find((f) => f.id === v)?.name ?? "None")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {fields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sortFieldId && (
                <Select
                  value={sortDirection ?? "asc"}
                  onValueChange={(v) =>
                    apply({ sortDirection: v as "asc" | "desc" })
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Filters
          </span>
          {filterConfig.map((rule, i) => {
            const field = fields.find((f) => f.id === rule.fieldId);
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-md bg-muted px-2 py-1 text-xs"
              >
                <span>
                  {field?.name ?? "Unknown field"} {rule.operator}{" "}
                  {Array.isArray(rule.value)
                    ? rule.value.join(", ")
                    : String(rule.value)}
                </span>
                <button
                  aria-label="Remove filter"
                  onClick={() =>
                    apply({
                      filterConfig: filterConfig.filter((_, idx) => idx !== i),
                    })
                  }
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
          <div className="flex gap-1.5">
            <Select value={newFilterFieldId} onValueChange={(v) => setNewFilterFieldId(v ?? "")}>
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {newFilterField &&
            (newFilterField.type === "SINGLE_SELECT" ||
              newFilterField.type === "MULTI_SELECT") ? (
              <Select value={newFilterValue} onValueChange={(v) => setNewFilterValue(v ?? "")}>
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Value" />
                </SelectTrigger>
                <SelectContent>
                  {(fieldOptionsById.get(newFilterField.id) ?? []).map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : newFilterField?.type === "PERSON" ? (
              <Select value={newFilterValue} onValueChange={(v) => setNewFilterValue(v ?? "")}>
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Value" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="w-1/2"
                placeholder="Value"
                value={newFilterValue}
                onChange={(e) => setNewFilterValue(e.target.value)}
              />
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!newFilterFieldId || !newFilterValue}
            onClick={() => {
              if (!newFilterField) return;
              const rule: FilterRule = {
                fieldId: newFilterField.id,
                operator: DEFAULT_OPERATOR[newFilterField.type],
                value:
                  newFilterField.type === "MULTI_SELECT"
                    ? [newFilterValue]
                    : newFilterValue,
              };
              apply({ filterConfig: [...filterConfig, rule] });
              setNewFilterFieldId("");
              setNewFilterValue("");
            }}
          >
            Add filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
