const registry = new Map<string, HTMLMediaElement>();

export function registerMediaElement(
  attachmentId: string,
  el: HTMLMediaElement | null,
) {
  if (el) {
    registry.set(attachmentId, el);
  } else {
    registry.delete(attachmentId);
  }
}

export function seekMediaElement(attachmentId: string, seconds: number): boolean {
  const el = registry.get(attachmentId);
  if (!el) return false;
  el.currentTime = seconds;
  void el.play().catch(() => {});
  return true;
}
