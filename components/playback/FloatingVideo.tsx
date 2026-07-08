"use client";

import { useEffect, useRef, useState } from "react";
import { registerMediaElement } from "@/lib/editor/mediaRegistry";

/**
 * One <video> element, always position:fixed, animated between two states:
 *
 *   hero — fixed container precisely covers the in-flow placeholder div.
 *   pip  — fixed to bottom-left corner, small.
 *
 * In hero mode the container position is updated by writing directly to
 * containerRef.current.style — no React re-render, no jiggle on scroll.
 * Only the pip↔hero toggle goes through setState (happens once per scroll
 * direction change, not on every scroll tick).
 */
export function FloatingVideo({ attachmentId }: { attachmentId: string }) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);
  const floatingRef = useRef(false);

  // Sync the fixed container to the placeholder rect — writes DOM directly, no re-render
  const syncHeroPosition = () => {
    const placeholder = placeholderRef.current;
    const container = containerRef.current;
    if (!placeholder || !container) return;
    const r = placeholder.getBoundingClientRect();
    container.style.top = `${r.top}px`;
    container.style.left = `${r.left}px`;
    container.style.width = `${r.width}px`;
    container.style.height = `${r.height}px`;
  };

  // Initial position + resize
  useEffect(() => {
    syncHeroPosition();
    const onResize = () => { if (!floatingRef.current) syncHeroPosition(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll — update hero position directly in the handler, zero re-renders
  useEffect(() => {
    const onScroll = () => { if (!floatingRef.current) syncHeroPosition(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver toggles pip mode
  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      const nowFloating = !entry.isIntersecting;
      floatingRef.current = nowFloating;
      setFloating(nowFloating);
    }, { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // When returning to hero mode, snap position immediately before transition re-enables
  useEffect(() => {
    if (!floating) syncHeroPosition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floating]);

  const heroStyle: React.CSSProperties = {
    position: "fixed",
    borderRadius: "0.375rem",
    overflow: "hidden",
    zIndex: 40,
    transition: "none",
  };

  const pipStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 16,
    left: 16,
    top: "auto",
    width: 288,
    height: "auto",
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    zIndex: 40,
    transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
  };

  return (
    <>
      {/* Placeholder reserves space in the document flow */}
      <div
        ref={placeholderRef}
        className="w-full rounded bg-black"
        style={{ aspectRatio: "16/9" }}
      />

      {/* Fixed video — position set imperatively in hero mode, via CSS in pip mode */}
      <div ref={containerRef} style={floating ? pipStyle : heroStyle}>
        <video
          ref={(el) => registerMediaElement(attachmentId, el)}
          src={`/api/attachments/${attachmentId}`}
          controls
          className="w-full h-full object-contain block bg-black"
        />
      </div>
    </>
  );
}
