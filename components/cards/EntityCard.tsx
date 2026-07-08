import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function EntityCard({
  href,
  title,
  subtitle,
  compact = false,
  thumbnailSrc,
}: {
  href: string;
  title: string;
  subtitle: string;
  compact?: boolean;
  thumbnailSrc?: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full overflow-hidden transition-colors hover:bg-muted/50">
        {thumbnailSrc && (
          <div className="aspect-video w-full bg-muted">
            {/* Plain img — thumbnail route is authenticated, next/image optimizer
                fetches server-side without cookies and would get a 401. */}
            <img
              src={thumbnailSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
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
