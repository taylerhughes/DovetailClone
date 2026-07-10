"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputActionProps
  extends React.ComponentProps<"input"> {
  /** Error message displayed below the input. Sets aria-invalid. */
  error?: string;
  /** Called when the submit arrow is clicked or Enter is pressed. */
  onSubmit?: () => void;
  /** Whether the submit action is in progress. Disables the arrow button. */
  pending?: boolean;
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="18"
      height="18"
      aria-hidden
      className={cn("shrink-0 fill-current", className)}
      shapeRendering="geometricPrecision"
    >
      <path d="M38.4276 48.4568C37.6464 49.239 36.3791 49.2398 35.5969 48.4585C34.8148 47.6773 34.814 46.41 35.5952 45.6278L47.2162 34.0209H12.01C10.9054 34.0209 10.01 33.1255 10.01 32.0209C10.01 30.9164 10.9054 30.0209 12.01 30.0209H47.1823L35.5952 18.4478C34.814 17.6657 34.8148 16.3984 35.5969 15.6171C36.3791 14.8359 37.6464 14.8367 38.4276 15.6188L53.45 30.6233C54.2312 31.403 54.2326 32.6683 53.4529 33.4495C53.452 33.4505 53.451 33.4515 53.45 33.4524L38.4276 48.4568Z" />
    </svg>
  );
}

export const InputAction = React.forwardRef<HTMLInputElement, InputActionProps>(
  ({ className, error, onSubmit, pending, disabled, ...props }, ref) => {
    const hasError = Boolean(error);

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit?.();
      }
      props.onKeyDown?.(e);
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="relative h-11 w-full">
          <input
            ref={ref}
            data-slot="input"
            aria-invalid={hasError || undefined}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex h-11 w-full min-w-0 rounded-md border bg-transparent pl-3 pr-10",
              "font-type-body text-fs-100 text-foreground",
              "placeholder:text-muted-foreground",
              "transition-colors outline-none",
              "border-border",
              "hover:[&:not(:focus)]:border-foreground/40",
              "focus:border-ring focus:ring-3 focus:ring-ring/20",
              "disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:border-border",
              "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
              className,
            )}
            {...props}
          />

          <button
            type="submit"
            onClick={onSubmit}
            disabled={disabled || pending || !props.value}
            aria-label="Continue"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "flex size-7 items-center justify-center rounded-md",
              "text-foreground transition-opacity",
              "hover:opacity-60 active:opacity-60",
              "disabled:opacity-30 disabled:cursor-default",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <ArrowIcon />
          </button>
        </div>

        {hasError && (
          <p className="font-type-body text-fs-75 text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);

InputAction.displayName = "InputAction";
