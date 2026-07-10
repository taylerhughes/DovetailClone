"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
  Type,
  Hash,
  ChevronDown,
  List,
  CalendarDays,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { TagBadge } from "@/components/tags/TagBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";
import type { FieldType } from "@/lib/generated/prisma/client";
import type { FieldValueInput } from "@/lib/fieldValueTypes";

export type FieldOption = { id: string; label: string; color: string };
export type TeamMemberOption = { id: string; name: string };

export interface NoteField {
  id: string;
  name: string;
  type: FieldType;
  options: FieldOption[];
}

export interface NoteFieldValue {
  fieldId: string;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  teamMemberId: string | null;
  selectedOptionIds: string[];
}

function FieldIcon({ type }: { type: FieldType }) {
  const cls = "size-4 shrink-0 text-muted-foreground";
  switch (type) {
    case "TEXT":       return <Type className={cls} />;
    case "NUMBER":     return <Hash className={cls} />;
    case "DATE":       return <CalendarDays className={cls} />;
    case "PERSON":     return <User className={cls} />;
    case "SINGLE_SELECT": return <ChevronDown className={cls} />;
    case "MULTI_SELECT":  return <List className={cls} />;
    default:           return <Type className={cls} />;
  }
}

function FieldValueDisplay({
  type,
  field,
  value,
  teamMembers,
  onSubmit,
}: {
  type: FieldType;
  field: NoteField;
  value: NoteFieldValue | undefined;
  teamMembers: TeamMemberOption[];
  onSubmit: (input: FieldValueInput) => void;
}) {
  const { canEdit } = useProjectAccess();
  const [editingText, setEditingText] = useState(false);

  const isEmpty = !value ||
    (type === "TEXT" && !value.valueText) ||
    (type === "NUMBER" && value.valueNumber === null) ||
    (type === "DATE" && !value.valueDate) ||
    (type === "PERSON" && !value.teamMemberId) ||
    ((type === "SINGLE_SELECT" || type === "MULTI_SELECT") && value.selectedOptionIds.length === 0);

  if (type === "TEXT") {
    if (!canEdit) {
      return (
        <span className={isEmpty ? "text-muted-foreground" : "text-foreground text-sm"}>
          {value?.valueText || "Empty"}
        </span>
      );
    }
    if (editingText) {
      return (
        <Input
          autoFocus
          defaultValue={value?.valueText ?? ""}
          className="h-7 w-48 text-sm"
          onBlur={(e) => {
            setEditingText(false);
            onSubmit({ kind: "TEXT", value: e.target.value });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              e.currentTarget.blur();
            }
          }}
        />
      );
    }
    return (
      <button
        type="button"
        onClick={() => setEditingText(true)}
        className={`text-sm hover:text-foreground ${isEmpty ? "text-muted-foreground" : "text-foreground"}`}
      >
        {value?.valueText || "Empty"}
      </button>
    );
  }

  if (type === "NUMBER") {
    if (!canEdit) {
      return (
        <span className={isEmpty ? "text-muted-foreground" : "text-foreground text-sm"}>
          {value?.valueNumber?.toString() ?? "Empty"}
        </span>
      );
    }
    if (editingText) {
      return (
        <Input
          autoFocus
          type="number"
          defaultValue={value?.valueNumber ?? ""}
          className="h-7 w-32 text-sm"
          onBlur={(e) => {
            setEditingText(false);
            onSubmit({
              kind: "NUMBER",
              value: e.target.value === "" ? null : Number(e.target.value),
            });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
          }}
        />
      );
    }
    return (
      <button
        type="button"
        onClick={() => setEditingText(true)}
        className={`text-sm hover:text-foreground ${isEmpty ? "text-muted-foreground" : "text-foreground"}`}
      >
        {value?.valueNumber?.toString() ?? "Empty"}
      </button>
    );
  }

  if (type === "DATE") {
    if (!canEdit) {
      return (
        <span className={isEmpty ? "text-muted-foreground" : "text-foreground text-sm"}>
          {value?.valueDate ?? "Empty"}
        </span>
      );
    }
    return (
      <Input
        type="date"
        defaultValue={value?.valueDate ?? ""}
        className="h-7 w-40 text-sm"
        onChange={(e) => onSubmit({ kind: "DATE", value: e.target.value || null })}
      />
    );
  }

  if (type === "PERSON") {
    const person = teamMembers.find((m) => m.id === value?.teamMemberId);
    if (!canEdit) {
      return (
        <span className={isEmpty ? "text-muted-foreground" : "text-foreground text-sm"}>
          {person?.name ?? "Empty"}
        </span>
      );
    }
    return (
      <Select
        value={value?.teamMemberId ?? "__none__"}
        onValueChange={(v) =>
          onSubmit({ kind: "PERSON", teamMemberId: v === "__none__" ? null : v })
        }
      >
        <SelectTrigger className="h-7 w-40 text-sm">
          <SelectValue placeholder="Empty">
            {(v: string) =>
              v === "__none__" || !v
                ? <span className="text-muted-foreground">Empty</span>
                : <span>{teamMembers.find((m) => m.id === v)?.name ?? "Empty"}</span>
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Empty</SelectItem>
          {teamMembers.map((m) => (
            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === "SINGLE_SELECT") {
    const current = value?.selectedOptionIds[0] ?? "__none__";
    const selected = field.options.find((o) => o.id === current);
    if (!canEdit) {
      return selected
        ? <TagBadge name={selected.label} color={selected.color} />
        : <span className="text-muted-foreground text-sm">Empty</span>;
    }
    return (
      <Select
        value={current}
        onValueChange={(v) =>
          onSubmit({ kind: "SINGLE_SELECT", optionId: v === "__none__" ? null : v })
        }
      >
        <SelectTrigger className="h-7 w-40 text-sm">
          <SelectValue placeholder="Empty">
            {(v: string) =>
              v === "__none__" || !v
                ? <span className="text-muted-foreground">Empty</span>
                : (() => {
                    const opt = field.options.find((o) => o.id === v);
                    return opt ? <TagBadge name={opt.label} color={opt.color} /> : <span className="text-muted-foreground">Empty</span>;
                  })()
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Empty</SelectItem>
          {field.options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              <TagBadge name={o.label} color={o.color} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // MULTI_SELECT
  const selected = field.options.filter((o) => value?.selectedOptionIds.includes(o.id));
  if (!canEdit) {
    return selected.length === 0
      ? <span className="text-muted-foreground text-sm">Empty</span>
      : <div className="flex flex-wrap gap-1">{selected.map((o) => <TagBadge key={o.id} name={o.label} color={o.color} />)}</div>;
  }
  return <MultiSelectValue field={field} value={value} onSubmit={onSubmit} />;
}

function MultiSelectValue({
  field,
  value,
  onSubmit,
}: {
  field: NoteField;
  value: NoteFieldValue | undefined;
  onSubmit: (input: FieldValueInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = field.options.filter((o) => value?.selectedOptionIds.includes(o.id));

  return (
    <div className="relative">
      <button
        type="button"
        className="flex min-h-7 flex-wrap items-center gap-1 rounded-lg border border-input px-2 py-1 text-left text-sm hover:bg-muted/50"
        onClick={() => setOpen((o) => !o)}
      >
        {selected.length === 0
          ? <span className="text-muted-foreground">Empty</span>
          : selected.map((o) => <TagBadge key={o.id} name={o.label} color={o.color} />)
        }
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 flex w-48 flex-col gap-0.5 rounded-lg border bg-popover p-1 shadow-md">
          {field.options.map((o) => {
            const isSelected = value?.selectedOptionIds.includes(o.id) ?? false;
            return (
              <button
                key={o.id}
                type="button"
                className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted"
                onClick={() => onSubmit({ kind: "MULTI_SELECT", optionId: o.id, checked: !isSelected })}
              >
                <TagBadge name={o.label} color={o.color} />
                {isSelected && <span className="text-xs text-muted-foreground">✓</span>}
              </button>
            );
          })}
          <button
            type="button"
            className="mt-0.5 rounded-md px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export function NoteFieldsPanel({
  fields,
  fieldValues,
  teamMembers,
  onSubmit,
}: {
  fields: NoteField[];
  fieldValues: NoteFieldValue[];
  teamMembers: TeamMemberOption[];
  onSubmit: (fieldId: string, input: FieldValueInput) => Promise<void>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (fields.length === 0) return null;

  function submit(fieldId: string, input: FieldValueInput) {
    startTransition(async () => {
      await onSubmit(fieldId, input);
      router.refresh();
    });
  }

  const valueByFieldId = new Map(fieldValues.map((v) => [v.fieldId, v]));

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {fields.map((field) => (
        <div key={field.id} className="flex items-center gap-3 px-4 py-3">
          <FieldIcon type={field.type} />
          <span className="flex-1 text-sm font-medium">{field.name}</span>
          <div className="shrink-0">
            <FieldValueDisplay
              type={field.type}
              field={field}
              value={valueByFieldId.get(field.id)}
              teamMembers={teamMembers}
              onSubmit={(input) => submit(field.id, input)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
