"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagBadge } from "@/components/tags/TagBadge";
import {
  addFieldOption,
  deleteFieldOption,
  renameFieldOption,
} from "@/actions/fields";

type Option = { id: string; label: string; color: string };

export function FieldOptionsEditor({
  fieldId,
  options,
}: {
  fieldId: string;
  options: Option[];
}) {
  const [newLabel, setNewLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="ml-4 flex flex-col gap-1.5 border-l pl-4">
      {options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <TagBadge name={option.label} color={option.color} />
          <Input
            defaultValue={option.label}
            className="h-6 max-w-40 text-xs"
            onBlur={(e) => {
              if (e.target.value.trim() && e.target.value !== option.label) {
                startTransition(async () => {
                  await renameFieldOption(option.id, e.target.value);
                  router.refresh();
                });
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Delete option"
            onClick={() =>
              startTransition(async () => {
                await deleteFieldOption(option.id);
                router.refresh();
              })
            }
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <form
        className="flex gap-1.5"
        action={() => {
          if (!newLabel.trim()) return;
          startTransition(async () => {
            await addFieldOption(fieldId, newLabel);
            setNewLabel("");
            router.refresh();
          });
        }}
      >
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New option"
          className="h-6 max-w-40 text-xs"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon-xs"
          disabled={isPending || !newLabel.trim()}
        >
          <Plus />
        </Button>
      </form>
    </div>
  );
}
