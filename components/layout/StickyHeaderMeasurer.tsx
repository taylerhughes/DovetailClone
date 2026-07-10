"use client";

import { useEffect, useRef } from "react";

/**
 * Measures its children's rendered height and publishes it as a CSS variable
 * on <html> so nested sticky elements can stack correctly.
 */
export function StickyHeaderMeasurer({
  variable,
  children,
  className,
  style,
}: {
  variable: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty(variable, `${el.offsetHeight}px`);
    });
    observer.observe(el);
    document.documentElement.style.setProperty(variable, `${el.offsetHeight}px`);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(variable);
    };
  }, [variable]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
