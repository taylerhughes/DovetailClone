const registry = new Map<string, HTMLMediaElement>();

type PlayingListener = (attachmentId: string, playing: boolean) => void;
const playingListeners = new Set<PlayingListener>();

function notifyPlaying(attachmentId: string, playing: boolean) {
  for (const l of playingListeners) l(attachmentId, playing);
}

export function subscribeToPlayingState(listener: PlayingListener): () => void {
  playingListeners.add(listener);
  return () => playingListeners.delete(listener);
}

export function registerMediaElement(
  attachmentId: string,
  el: HTMLMediaElement | null,
) {
  if (el) {
    registry.set(attachmentId, el);
    el.addEventListener("play", () => notifyPlaying(attachmentId, true));
    el.addEventListener("pause", () => notifyPlaying(attachmentId, false));
    el.addEventListener("ended", () => notifyPlaying(attachmentId, false));
  } else {
    registry.delete(attachmentId);
    notifyPlaying(attachmentId, false);
  }
}

export function seekMediaElement(attachmentId: string, seconds: number): boolean {
  const el = registry.get(attachmentId);
  if (!el) return false;
  el.currentTime = seconds;
  void el.play().catch(() => {});
  return true;
}

export function subscribeToMediaTime(
  attachmentId: string,
  callback: (currentTime: number) => void,
): () => void {
  const el = registry.get(attachmentId);
  if (!el) return () => {};
  const handler = () => callback(el.currentTime);
  el.addEventListener("timeupdate", handler);
  return () => el.removeEventListener("timeupdate", handler);
}

export function setMediaPaused(attachmentId: string, paused: boolean): void {
  const el = registry.get(attachmentId);
  if (!el) return;
  if (paused) {
    el.pause();
  } else {
    void el.play().catch(() => {});
  }
}

export function getMediaState(
  attachmentId: string,
): { paused: boolean; duration: number; currentTime: number } | null {
  const el = registry.get(attachmentId);
  if (!el) return null;
  return { paused: el.paused, duration: el.duration || 0, currentTime: el.currentTime };
}
