import { useEffect } from 'react'

// Image protection (visual standards, "Image protection" layers 3–4).
// Blocks the context menu, dragging and long-press save on images only; links, text and keyboard stay usable.
// Nothing stops a screenshot: web renditions, the faint mark and EXIF copyright carry the rest.
export function useImageProtection() {
  useEffect(() => {
    const isImage = (t: EventTarget | null) =>
      t instanceof Element && Boolean(t.closest('img, picture, .card-tile, .cam, .profile-portrait, .hero-drift'))

    const block = (e: Event) => {
      if (isImage(e.target)) e.preventDefault()
    }

    document.addEventListener('contextmenu', block)
    document.addEventListener('dragstart', block)
    return () => {
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('dragstart', block)
    }
  }, [])
}
