import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { mediaUrl } from '../../lib/media'
import { loadFilmIntros } from './filmIntros'
import { IntroFilm } from './IntroFilm'

const FILM = mediaUrl('films/tizita/Tizita_Saba_home_1080.mp4')
const POSTER = mediaUrl('films/tizita/Tizita_Saba_poster.jpg')

// The film section: Saba's concept film (Tizita) large, then each published model's 9:16 intro beside it
// (models.intro_video_path / intro_poster_path, roster order). Tizita has no src until the section nears
// the viewport and only plays on a click, with sound; the intros play muted while in view (IntroFilm).
// pageReady: the content above has its final height, so a /#film link can jump here without a shift.
export function ConceptFilm({ pageReady }: { pageReady: boolean }) {
  const section = useRef<HTMLElement>(null)
  const intros = useAsync('film-intros', loadFilmIntros)
  const list = intros.status === 'ready' ? intros.data : []
  const { hash } = useLocation()
  const jumped = useRef(false)
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

  // /#film: the browser can't jump on load (the section renders later), so jump once everything above
  // and the grid itself have settled. Two frames: the final layout is painted first, while the section
  // is still off-screen, so its move is not seen as a layout shift; then the page scrolls to it.
  useEffect(() => {
    if (hash !== '#film' || jumped.current || !pageReady || intros.status === 'loading') return
    jumped.current = true
    requestAnimationFrame(() => requestAnimationFrame(() => section.current?.scrollIntoView({ block: 'start' })))
  }, [hash, pageReady, intros.status])

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
        <p className="film-line">One face, one session, every frame. Saba (SB01) in a 1970s Addis Ababa recording studio.</p>

        <div
          className={list.length > 0 ? 'film-grid has-intros' : 'film-grid'}
          style={{ '--intros': list.length } as CSSProperties}
        >
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
          {/* Each intro column: the video plus a name card. From 1024px the columns stagger by roster
              position: 1st, 3rd, ... video on top; 2nd, 4th, ... name card on top (CSS, .is-flipped). */}
          {list.map((m, i) => (
            <div key={m.slug} className={i % 2 === 1 ? 'film-intro-cell is-flipped' : 'film-intro-cell'}>
              <IntroFilm src={mediaUrl(m.intro_video_path)} poster={mediaUrl(m.intro_poster_path)} name={m.name} />
              <Link to={`/models/${m.slug}`} className="film-namecard">
                <span className="display film-namecard-name">{m.name}</span>
                <span className="label film-namecard-meta">
                  {m.model_code && <span>{m.model_code}</span>}
                  <span className="film-namecard-view">View →</span>
                </span>
              </Link>
            </div>
          ))}
        </div>
        <p className="film-disclosure">
          AI-generated models and music. No real person is depicted. Our own concept work, not a client campaign.
        </p>

        <div className="cta-row film-cta">
          <a href="/m/saba/" className="btn btn-ghost">
            Meet Saba →
          </a>
        </div>
      </div>
    </section>
  )
}
