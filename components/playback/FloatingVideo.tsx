"use client";

import { useEffect, useRef, useState } from "react";
import { registerMediaElement } from "@/lib/editor/mediaRegistry";

export function FloatingVideo({ attachmentId }: { attachmentId: string }) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);
  const floatingRef = useRef(false);

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

  useEffect(() => {
    syncHeroPosition();
    const onResize = () => { if (!floatingRef.current) syncHeroPosition(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Body is the scroll container — listen on document (not window) for scroll
  useEffect(() => {
    const onScroll = () => { if (!floatingRef.current) syncHeroPosition(); };
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver: trigger PiP when placeholder scrolls out of view,
  // with top margin to account for the app header + note title bar (~108px)
  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowFloating = !entry.isIntersecting;
        floatingRef.current = nowFloating;
        setFloating(nowFloating);
      },
      { rootMargin: "-108px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!floating) syncHeroPosition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floating]);

  const heroStyle: React.CSSProperties = {
    position: "fixed",
    borderRadius: "0.375rem",
    overflow: "hidden",
    zIndex: 10,
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
    zIndex: 10,
    transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
  };

  return (
    <>
      <div
        ref={placeholderRef}
        className="w-full rounded bg-black"
        style={{ aspectRatio: "16/9" }}
      />
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
