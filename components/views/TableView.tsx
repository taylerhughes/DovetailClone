"use client";

import Link from "next/link";
import { Text as TypographyText } from "@/components/ui/text";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FieldEditorCell,
  type FieldOption,
  type TeamMemberOption,
} from "@/components/fields/FieldEditorCell";
import type { FieldType } from "@/lib/generated/prisma/client";
import type { FieldValueInput } from "@/lib/fieldValueTypes";

type TableNote = {
  id: string;
  title: string;
  updatedAt: Date;
  fieldValues: {
    fieldId: string;
    valueText: string | null;
    valueNumber: number | null;
    valueDate: Date | null;
    teamMemberId: string | null;
    selectedOptions: { fieldOptionId: string }[];
  }[];
};

type TableField = {
  id: string;
  name: string;
  type: FieldType;
  options: FieldOption[];
};

const columnHelper = createColumnHelper<TableNote>();

export function TableView({
  projectId,
  detailPathPrefix,
  notes,
  fields,
  teamMembers,
  fieldValueAction,
}: {
  projectId: string;
  detailPathPrefix: "data" | "insights";
  notes: TableNote[];
  fields: TableField[];
  teamMembers: TeamMemberOption[];
  fieldValueAction: (
    entityId: string,
    fieldId: string,
    input: FieldValueInput,
  ) => Promise<void>;
}) {
  const columns = [
    columnHelper.accessor("title", {
      header: "Title",
      cell: (info) => (
        <Link
          href={`/projects/${projectId}/${detailPathPrefix}/${info.row.original.id}`}
          className="font-medium hover:underline"
        >
          {info.getValue()}
        </Link>
      ),
    }),
    ...fields.map((field) =>
      columnHelper.display({
        id: field.id,
        header: field.name,
        cell: (info) => {
          const note = info.row.original;
          const fv = note.fieldValues.find((v) => v.fieldId === field.id);
          return (
            <FieldEditorCell
              type={field.type}
              options={field.options}
              teamMembers={teamMembers}
              onSubmit={fieldValueAction.bind(null, note.id, field.id)}
              value={{
                valueText: fv?.valueText ?? null,
                valueNumber: fv?.valueNumber ?? null,
                valueDate: fv?.valueDate
                  ? fv.valueDate.toISOString().slice(0, 10)
                  : null,
                teamMemberId: fv?.teamMemberId ?? null,
                selectedOptionIds:
                  fv?.selectedOptions.map((o) => o.fieldOptionId) ?? [],
              }}
            />
          );
        },
      }),
    ),
    columnHelper.accessor("updatedAt", {
      header: "Updated",
      cell: (info) => (
        <TypographyText as="span" size={75} color="subdued">{info.getValue().toLocaleDateString()}</TypographyText>
      ),
    }),
  ];

  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (notes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
        <TypographyText size={100} weight="medium">No notes match this view</TypographyText>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
