"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <Text size={100} weight="medium">Something went wrong</Text>
      <Text size={100} color="subdued" className="max-w-sm">An unexpected error occurred. You can try again, or head back to the project list.</Text>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button onClick={() => (window.location.href = "/")}>
          Back to projects
        </Button>
      </div>
    </main>
  );
}
