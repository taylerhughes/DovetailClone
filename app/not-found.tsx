import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-medium">Not found</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page doesn&rsquo;t exist, or it may have been deleted.
      </p>
      <Button render={<Link href="/" />}>Back to projects</Button>
    </main>
  );
}
