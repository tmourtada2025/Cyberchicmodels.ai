import { useEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { isLightboxOpen, setLightboxOpen, useLightboxOpen } from './lightboxState'

type IntroFilmProps = { src: string; poster: string; name: string }

// A model's 9:16 intro film in the homepage film grid. The box is reserved by CSS (aspect-ratio) and shows the
// poster from first paint. The video gets no src until the box is in view; it then plays muted and
// loops while in view, and pauses when it leaves. The small button toggles sound.
// With prefers-reduced-motion: no autoplay. The poster shows a play button; the film loads and plays
// once only when asked, and the button over the box stops it again.
// Clicking the tile (or Enter/Space on it) opens the intro in a lightbox: as large as the screen allows
// at 9:16, from the start, with sound and controls. Esc, the close button or a click outside closes it,
// and focus returns to the tile. The page behind does not move (scroll locked, scrollbar width kept).
export function IntroFilm({ src, poster, name }: IntroFilmProps) {
  const reduced = usePrefersReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(false)
  const [seen, setSeen] = useState(false)
  const [started, setStarted] = useState(false)
  // Reduced motion: once asked for, the film stays loaded, so a pause pauses it (dropping the src
  // would leave the element playing the resource it already has).
  const [requested, setRequested] = useState(false)
  const [muted, setMuted] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const openButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const lbVideo = useRef<HTMLVideoElement>(null)

  const anyLightbox = useLightboxOpen()

  const loaded = seen && (!reduced || requested)
  // Every tile rests while any intro lightbox is open.
  const wants = inView && !expanded && !anyLightbox && (!reduced || started)

  useEffect(() => {
    const node = box.current
    if (!node || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.25
        setInView(visible)
        if (visible) setSeen(true)
        else setStarted(false) // reduced motion: leaving the box ends the requested play
      },
      { threshold: [0, 0.25] },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  // Some WebKit builds stop at the loop point instead of wrapping. While the intro should be looping,
  // an unrequested pause or end restarts it (at most once a second, so a blocked play can't spin).
  const shouldLoop = useRef(false)
  const lastResume = useRef(0)
  const resume = () => {
    const el = video.current
    const now = Date.now()
    if (!el || !shouldLoop.current || isLightboxOpen() || document.hidden || now - lastResume.current < 1000) return
    lastResume.current = now
    if (el.ended) el.currentTime = 0
    void el.play().catch(() => {})
  }

  useEffect(() => {
    const el = video.current
    shouldLoop.current = loaded && wants && !reduced
    if (!el || !loaded) return
    if (wants) {
      el.muted = muted
      void el.play().catch(() => setStarted(false))
    } else {
      el.pause()
    }
  }, [loaded, wants, reduced, muted])

  const onEnded = () => {
    if (reduced) {
      setStarted(false)
      if (video.current) video.current.currentTime = 0
    } else {
      resume()
    }
  }

  // Open: mount the lightbox synchronously so play() runs inside the click (iOS only allows sound then).
  const open = () => {
    setLightboxOpen(true)
    flushSync(() => setExpanded(true))
    for (const v of document.querySelectorAll<HTMLVideoElement>('#film video')) if (v !== lbVideo.current) v.pause()
    const v = lbVideo.current
    if (v) {
      v.currentTime = 0
      v.muted = false
      void v.play().catch(() => {})
    }
    closeButton.current?.focus()
  }

  const close = () => {
    lbVideo.current?.pause()
    setLightboxOpen(false)
    setExpanded(false)
    openButton.current?.focus()
  }

  // While open: Esc closes, Tab stays inside the dialog, and the page can't scroll. Hiding overflow removes
  // a classic scrollbar, so its measured width is added back as padding: nothing behind moves. Overlay
  // scrollbars measure 0 and get no padding.
  useEffect(() => {
    if (!expanded) return
    const html = document.documentElement
    const prev = { overflow: html.style.overflow, padding: html.style.paddingRight }
    const scrollbar = window.innerWidth - html.clientWidth
    html.style.overflow = 'hidden'
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'Tab' && dialog.current) {
        const items = [...dialog.current.querySelectorAll<HTMLElement>('button, video[controls]')]
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      setLightboxOpen(false)
      html.style.overflow = prev.overflow
      html.style.paddingRight = prev.padding
    }
    // close() only touches refs and state setters, so the listener can keep the first one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  const toggleSound = () => {
    const el = video.current
    const next = !muted
    if (el) {
      el.muted = next
      if (!next && el.paused && wants) void el.play().catch(() => {})
    }
    setMuted(next)
  }

  return (
    <div className="film-intro" ref={box}>
      <video
        ref={video}
        src={loaded ? src : undefined}
        poster={poster}
        preload={loaded ? 'auto' : 'none'}
        muted
        loop={!reduced}
        playsInline
        disablePictureInPicture
        onPause={resume}
        onEnded={onEnded}
        aria-label={`${name}, intro film`}
      />
      <button
        type="button"
        className="film-intro-open"
        ref={openButton}
        onClick={open}
        aria-label={`Open ${name}'s intro film, with sound`}
        aria-haspopup="dialog"
      >
        <span className="film-intro-expand" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
          </svg>
        </span>
      </button>
      {reduced && (
        <button
          type="button"
          className={started ? 'film-intro-play is-playing' : 'film-intro-play'}
          onClick={() => {
            setRequested(true)
            setStarted(!started)
          }}
          aria-label={started ? `Pause ${name}'s intro film` : `Play ${name}'s intro film`}
        >
          <span className="film-intro-play-icon" aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        className="film-intro-sound"
        onClick={toggleSound}
        aria-pressed={!muted}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
          {muted ? (
            <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </svg>
      </button>
      {expanded &&
        createPortal(
          <div
            className="film-lightbox"
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label={`${name}, intro film`}
            onClick={(e) => {
              if (e.target === e.currentTarget) close()
            }}
          >
            <div className="film-lightbox-frame">
              <video ref={lbVideo} src={src} poster={poster} controls playsInline preload="auto" disablePictureInPicture />
            </div>
            <button type="button" className="film-lightbox-close" ref={closeButton} onClick={close} aria-label="Close">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
