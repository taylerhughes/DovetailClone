"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagBadge } from "@/components/tags/TagBadge";
import { setNoteFieldValue, type FieldValueInput } from "@/actions/fieldValues";
import type { FieldType } from "@/lib/generated/prisma/client";

export type FieldOption = { id: string; label: string; color: string };
export type TeamMemberOption = { id: string; name: string; color: string };

export interface FieldEditorCellValue {
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  teamMemberId: string | null;
  selectedOptionIds: string[];
}

export function FieldEditorCell({
  noteId,
  fieldId,
  type,
  options,
  teamMembers,
  value,
}: {
  noteId: string;
  fieldId: string;
  type: FieldType;
  options: FieldOption[];
  teamMembers: TeamMemberOption[];
  value: FieldEditorCellValue;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function submit(input: FieldValueInput) {
    startTransition(async () => {
      await setNoteFieldValue(noteId, fieldId, input);
      router.refresh();
    });
  }

  if (type === "TEXT") {
    return (
      <Input
        defaultValue={value.valueText ?? ""}
        className="h-7"
        onBlur={(e) => submit({ kind: "TEXT", value: e.target.value })}
      />
    );
  }

  if (type === "NUMBER") {
    return (
      <Input
        type="number"
        defaultValue={value.valueNumber ?? ""}
        className="h-7"
        onBlur={(e) =>
          submit({
            kind: "NUMBER",
            value: e.target.value === "" ? null : Number(e.target.value),
          })
        }
      />
    );
  }

  if (type === "DATE") {
    return (
      <Input
        type="date"
        defaultValue={value.valueDate ?? ""}
        className="h-7"
        onChange={(e) =>
          submit({ kind: "DATE", value: e.target.value || null })
        }
      />
    );
  }

  if (type === "PERSON") {
    return (
      <Select
        value={value.teamMemberId ?? "__none__"}
        onValueChange={(v) =>
          submit({ kind: "PERSON", teamMemberId: v === "__none__" ? null : v })
        }
      >
        <SelectTrigger className="h-7 w-full">
          <SelectValue placeholder="Unassigned">
            {(v: string) =>
              v === "__none__" || !v
                ? "Unassigned"
                : (teamMembers.find((m) => m.id === v)?.name ?? "Unassigned")
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Unassigned</SelectItem>
          {teamMembers.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === "SINGLE_SELECT") {
    const current = value.selectedOptionIds[0] ?? "__none__";
    return (
      <Select
        value={current}
        onValueChange={(v) =>
          submit({ kind: "SINGLE_SELECT", optionId: v === "__none__" ? null : v })
        }
      >
        <SelectTrigger className="h-7 w-full">
          <SelectValue placeholder="None">
            {(v: string) =>
              v === "__none__" || !v
                ? "None"
                : (options.find((o) => o.id === v)?.label ?? "None")
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // MULTI_SELECT
  return (
    <MultiSelectEditor
      options={options}
      selectedOptionIds={value.selectedOptionIds}
      onToggle={(optionId, checked) =>
        submit({ kind: "MULTI_SELECT", optionId, checked })
      }
    />
  );
}

function MultiSelectEditor({
  options,
  selectedOptionIds,
  onToggle,
}: {
  options: FieldOption[];
  selectedOptionIds: string[];
  onToggle: (optionId: string, checked: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => selectedOptionIds.includes(o.id));

  return (
    <div className="relative">
      <button
        type="button"
        className="flex min-h-7 w-full flex-wrap items-center gap-1 rounded-lg border border-input px-2 py-1 text-left text-sm"
        onClick={() => setOpen((o) => !o)}
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground">None</span>
        ) : (
          selected.map((o) => (
            <TagBadge key={o.id} name={o.label} color={o.color} />
          ))
        )}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 flex w-full flex-col gap-0.5 rounded-lg border bg-popover p-1 shadow-md">
          {options.map((o) => {
            const isSelected = selectedOptionIds.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted"
                onClick={() => onToggle(o.id, !isSelected)}
              >
                <TagBadge name={o.label} color={o.color} />
                {isSelected && <span className="text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
