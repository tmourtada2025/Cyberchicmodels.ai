import { useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../../lib/media'

const FILM = mediaUrl('films/tizita/Tizita_Saba_home_1080.mp4')
const POSTER = mediaUrl('films/tizita/Tizita_Saba_poster.jpg')

// Saba's concept film. The video has no src until the section nears the viewport,
// so the 10 MB file is never requested on load; it only starts on a user click (with sound).
export function ConceptFilm() {
  const section = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(() => !('IntersectionObserver' in window))
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const node = section.current
    if (!node || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  const play = () => {
    const el = video.current
    if (!el) return
    setStarted(true)
    void el.play().catch(() => setStarted(false))
  }

  return (
    <section className="section film" id="film" ref={section} aria-labelledby="film-title">
      <div className="container">
        <p className="label film-eyebrow">Concept film</p>
        <h2 className="display sec-title film-title" id="film-title">
          Tizita
        </h2>
        <p className="film-line">One face, one session, every frame. Saba (SB01) in a 1970s Addis recording studio.</p>

        <figure className="film-figure">
          <div className="film-frame">
            <video
              ref={video}
              src={inView ? FILM : undefined}
              poster={inView ? POSTER : undefined}
              preload="none"
              playsInline
              controls={started}
            />
            {!started && (
              <button type="button" className="film-play" onClick={play} aria-label="Play Tizita, the concept film">
                <img src={POSTER} alt="" loading="lazy" decoding="async" width={1920} height={1080} />
                <span className="film-play-icon" aria-hidden="true" />
              </button>
            )}
          </div>
          <figcaption>AI-generated. No real person is depicted. Our own concept work, not a client campaign.</figcaption>
        </figure>

        <div className="cta-row film-cta">
          {/* Plain link: /m/<slug>/ is a Vercel redirect to /models/<slug>, not a client route. */}
          <a href="/m/saba/" className="btn btn-ghost">
            Meet Saba →
          </a>
        </div>
      </div>
    </section>
  )
}
