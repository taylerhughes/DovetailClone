import Link from "next/link";
import { Text } from "@/components/ui/text";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  name: string;
  description: string;
  href: string;
  logo?: React.ReactNode;
}

export function IntegrationCard({ name, description, href, logo }: IntegrationCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-5">
      {logo && (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
          {logo}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1">
        <Text as="p" size={100} weight="medium">{name}</Text>
        <Text as="p" size={75} color="subdued">{description}</Text>
      </div>
      <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        Add
      </Link>
    </div>
  );
}
