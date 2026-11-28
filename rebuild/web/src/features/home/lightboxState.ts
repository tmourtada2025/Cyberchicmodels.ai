import { useSyncExternalStore } from 'react'

// Whether any intro lightbox is open. Every intro tile rests while one is, so the only sound is the
// lightbox's (and the WebKit loop guard doesn't restart a tile that was paused on purpose).
let open = false
const listeners = new Set<() => void>()

export function setLightboxOpen(value: boolean) {
  if (open === value) return
  open = value
  for (const l of listeners) l()
}

export function isLightboxOpen() {
  return open
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function useLightboxOpen(): boolean {
  return useSyncExternalStore(subscribe, isLightboxOpen, () => false)
}
