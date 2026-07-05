import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectShellLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b px-8 pt-6">
        <div className="mx-auto flex w-full max-w-5xl items-start justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-5xl gap-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-16" />
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-5xl flex-1 p-8">
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
