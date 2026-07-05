export function CapNotice({ shown, total }: { shown: number; total: number }) {
  if (total <= shown) return null;
  return (
    <p className="rounded-md border border-dashed bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      Showing first {shown} of {total} — refine your filters to narrow this down.
    </p>
  );
}
