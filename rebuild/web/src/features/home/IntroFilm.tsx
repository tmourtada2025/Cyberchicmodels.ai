import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

type IntroFilmProps = { src: string; poster: string; name: string }

// A model's 9:16 intro film in the homepage film grid. The box is reserved by CSS (aspect-ratio) and shows the
// poster from first paint. The video gets no src until the box is in view; it then plays muted and
// loops while in view, and pauses when it leaves. The small button toggles sound.
// With prefers-reduced-motion: no autoplay. The poster shows a play button; the film loads and plays
// once only when asked, and the button over the box stops it again.
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

  const loaded = seen && (!reduced || requested)
  const wants = inView && (!reduced || started)

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
    if (!el || !shouldLoop.current || document.hidden || now - lastResume.current < 1000) return
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
    </div>
  )
}
