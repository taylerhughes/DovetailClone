"use client";

import Link from "next/link";
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
import { TagBadge } from "@/components/tags/TagBadge";
import type { TagOption } from "@/components/tags/TagPicker";

export interface HighlightTableRow {
  id: string;
  quote: string;
  noteId: string;
  noteTitle: string;
  tagIds: string[];
  createdAt: Date;
}

const columnHelper = createColumnHelper<HighlightTableRow>();

export function HighlightsTableView({
  projectId,
  highlights,
  allTags,
}: {
  projectId: string;
  highlights: HighlightTableRow[];
  allTags: TagOption[];
}) {
  const tagsById = new Map(allTags.map((t) => [t.id, t]));

  const columns = [
    columnHelper.accessor("quote", {
      header: "Highlight",
      cell: (info) => (
        <Link
          href={`/projects/${projectId}/data/${info.row.original.noteId}`}
          className="line-clamp-2 hover:underline"
        >
          &ldquo;{info.getValue() || "(empty)"}&rdquo;
        </Link>
      ),
    }),
    columnHelper.accessor("noteTitle", {
      header: "Source note",
      cell: (info) => (
        <Link
          href={`/projects/${projectId}/data/${info.row.original.noteId}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor("tagIds", {
      header: "Tags",
      cell: (info) => (
        <div className="flex flex-wrap gap-1">
          {info.getValue().map((tagId) => {
            const tag = tagsById.get(tagId);
            return tag ? <TagBadge key={tagId} name={tag.name} color={tag.color} /> : null;
          })}
        </div>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      cell: (info) => (
        <span className="text-xs text-muted-foreground">
          {info.getValue().toLocaleDateString()}
        </span>
      ),
    }),
  ];

  const table = useReactTable({
    data: highlights,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (highlights.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
        <p className="text-sm font-medium">No highlights match this view</p>
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
