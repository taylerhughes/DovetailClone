import Link from "next/link";
import { Text } from "@/components/ui/text";

interface EventRow {
  id: string;
  status: string;
  noteId: string | null;
  error: string | null;
  createdAt: Date;
  integration: { projectId: string };
}

export function IntegrationEventLog({ events }: { events: EventRow[] }) {
  if (events.length === 0) {
    return (
      <Text as="p" size={75} color="subdued">
        No events yet. Trigger a Zap to see activity here.
      </Text>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Note</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b last:border-0">
              <td className="px-4 py-2 text-muted-foreground">
                {new Date(event.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    event.status === "ok"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {event.status}
                </span>
                {event.error && (
                  <span className="ml-2 text-xs text-muted-foreground">{event.error}</span>
                )}
              </td>
              <td className="px-4 py-2">
                {event.noteId ? (
                  <Link
                    href={`/projects/${event.integration.projectId}/data/${event.noteId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    View note
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
