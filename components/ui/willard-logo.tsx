import { cn } from "@/lib/utils";

export function WillardLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 204 204"
      aria-label="Willard"
      className={cn("fill-current", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M81.6 0H122.4V40.8H81.6V0Z" />
      <path d="M40.8 40.8H81.6V81.6H40.8V40.8Z" />
      <path d="M0 81.6H40.8V122.4H0V81.6Z" />
      <path d="M163.2 81.6H204V122.4H163.2V81.6Z" />
      <path d="M40.8 122.4H81.6V163.2H40.8V122.4Z" />
      <path d="M122.4 40.8H163.2V81.6H122.4V40.8Z" />
      <path d="M122.4 122.4H163.2V163.2H122.4V122.4Z" />
      <path d="M81.6 163.2H122.4V204H81.6V163.2Z" />
    </svg>
  );
}
