import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function EntityCard({
  href,
  title,
  subtitle,
  compact = false,
}: {
  href: string;
  title: string;
  subtitle: string;
  compact?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className={compact ? "gap-0.5 p-3" : undefined}>
          <CardTitle className={compact ? "text-sm" : undefined}>
            {title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {subtitle || "Empty"}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
