"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FieldOptionsEditor } from "./FieldOptionsEditor";
import { createField, deleteField } from "@/actions/fields";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";
import type { FieldType } from "@/lib/generated/prisma/client";

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  SINGLE_SELECT: "Single select",
  MULTI_SELECT: "Multi select",
  PERSON: "Person",
  DATE: "Date",
};

const SELECT_TYPES: FieldType[] = ["SINGLE_SELECT", "MULTI_SELECT"];

type Field = {
  id: string;
  name: string;
  type: FieldType;
  options: { id: string; label: string; color: string }[];
};

export function FieldManager({
  projectId,
  initialFields,
}: {
  projectId: string;
  initialFields: Field[];
}) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<FieldType>("TEXT");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { canEdit } = useProjectAccess();

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <form
          className="flex gap-2"
          action={() => {
            if (!newName.trim()) return;
            startTransition(async () => {
              await createField(projectId, newName, newType);
              setNewName("");
              router.refresh();
            });
          }}
        >
          <Input
            placeholder="New field name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Select
            value={newType}
            onValueChange={(v) => setNewType(v as FieldType)}
          >
            <SelectTrigger className="w-40">
              <SelectValue>
                {(v: FieldType) => FIELD_TYPE_LABELS[v]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={isPending || !newName.trim()}>
            <Plus data-icon="inline-start" />
            Add field
          </Button>
        </form>
      )}

      {initialFields.length === 0 ? (
        <Text size={100} color="subdued">No custom fields yet. Fields let you add structured metadata to notes and organize them by Board/Table view.</Text>
      ) : (
        <div className="flex flex-col divide-y rounded-lg border">
          {initialFields.map((field) => (
            <div key={field.id} className="flex flex-col gap-2 p-3">
              <div className="flex items-center gap-2">
                <Text as="span" size={100} weight="medium">{field.name}</Text>
                <Badge variant="secondary">
                  {FIELD_TYPE_LABELS[field.type]}
                </Badge>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Delete field"
                    className="ml-auto"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteField(field.id);
                        router.refresh();
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
              {SELECT_TYPES.includes(field.type) && (
                <FieldOptionsEditor
                  fieldId={field.id}
                  options={field.options}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
