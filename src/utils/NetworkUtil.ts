type Listener = (online: boolean) => void;

const listeners: Set<Listener> = new Set();

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

function notify(): void {
  const online = isOnline();
  listeners.forEach((fn) => fn(online));
}

export function onNetworkChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function bindNetworkEvents(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', notify);
  window.addEventListener('offline', notify);
}
