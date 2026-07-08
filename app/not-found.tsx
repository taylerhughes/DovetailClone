import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <Text size={100} weight="medium">Not found</Text>
      <Text size={100} color="subdued" className="max-w-sm">This page doesn&rsquo;t exist, or it may have been deleted.</Text>
      <Button nativeButton={false} render={<Link href="/" />}>Back to projects</Button>
    </main>
  );
}
