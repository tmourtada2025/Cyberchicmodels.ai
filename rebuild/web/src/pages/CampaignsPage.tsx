import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import '../features/site-pages/site-pages.css'

// Verbatim port of rebuild/docs/site-pages/cyberchic-site-pages/index.html (the "Work" page).
export function CampaignsPage() {
  useDocumentTitle('Campaigns')

  return (
    <div className="sp sp-campaigns">
      <div className="wrap pagehead">
        <div className="sp-eyebrow">Work</div>
        <h1>Four faces. <span className="l">Four worlds.</span></h1>
        <p className="lead">Each model gets one editorial series: one concept, one place, six or seven frames, shot in-house to show the face holding across light, wardrobe and distance.</p>
        <p className="muted small" style={{ maxWidth: '62ch' }}>These series are our own concept work, not client campaigns. Brand campaigns appear here once a client approves publication.</p>
      </div>

      <section className="wrap" aria-label="Editorial series">
        <article className="series">
          <div className="meta">
            <span className="sp-chip">Concept work</span>
            <h2>Olive &amp; <span className="l">Owl</span></h2>
            <p className="muted">The Riviera from the olive terraces by day to the library by night. One olive-green fabric element in every look.</p>
            <dl><dt>Model</dt><dd>Athena · AT01</dd><dt>Frames</dt><dd>7</dd><dt>Places</dt><dd>Gorbio, Menton, Cap Martin, Cap Ferrat, Monaco</dd><dt>Lanes</dt><dd>Skincare · Fragrance · Watches · Leather goods</dd></dl>
            <div className="ctas"><a className="pill" href="/m/athena/">See Athena</a></div>
          </div>
          <div className="g3">
            <figure><div className="ph r45"><img src="/site/img/athena-t3-library-1024x1280.webp" alt="Athena in a villa library at night beside a barn owl" /></div><figcaption><b>III</b> · The Library</figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/athena-t4-strategist-1024x1280.webp" alt="Athena moving a knight on a harbour terrace chessboard at blue hour" /></div><figcaption><b>IV</b> · The Strategist</figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/athena-t1-path-1024x1280.webp" alt="Athena walking an olive terrace path in an olive linen dress" /></div><figcaption><b>I</b> · The Path</figcaption></figure>
          </div>
        </article>

        <article className="series">
          <div className="meta">
            <span className="sp-chip">Concept work</span>
            <h2>Silver <span className="l">Hour</span></h2>
            <p className="muted">One day in an old limestone house above the sea, from morning light to lamplight. Silver hair kept, lines kept.</p>
            <dl><dt>Model</dt><dd>Dalia · DL01</dd><dt>Frames</dt><dd>6</dd><dt>Places</dt><dd>A limestone house above the sea</dd><dt>Lanes</dt><dd>Fine jewellery · Pro-age beauty · Haircare · Luxury fashion</dd></dl>
            <div className="ctas"><a className="pill" href="/m/dalia/">See Dalia</a></div>
          </div>
          <div className="g3">
            <figure><div className="ph r45"><img src="/site/img/dalia-t1-morning-1024x1280.webp" alt="Dalia at a marble table in a limestone loggia above the sea" /></div><figcaption><b>I</b> · The Morning</figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/dalia-t3-heirloom-1024x1280.webp" alt="Dalia lifting a strand of cream pearls from a leather box" /></div><figcaption><b>III</b> · The Heirloom</figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/dalia-t6-silver-1024x1280.webp" alt="Dalia in profile at night, silver streak from temple to crown" /></div><figcaption><b>VI</b> · The Silver</figcaption></figure>
          </div>
        </article>

        <article className="series">
          <div className="meta">
            <span className="sp-chip">Concept work</span>
            <h2>The <span className="l">Thread</span></h2>
            <p className="muted">From the vineyards in the Cretan hills to the ferries between the islands: the vine, the stone and the sea road between them.</p>
            <dl><dt>Model</dt><dd>Ariadne · AR01</dd><dt>Frames</dt><dd>6</dd><dt>Places</dt><dd>Crete and the islands</dd><dt>Lanes</dt><dd>Wine · Hospitality · Resortwear · Jewellery</dd></dl>
            <div className="ctas"><a className="pill" href="/m/ariadne/">See Ariadne</a></div>
          </div>
          <div className="g3">
            <figure><div className="ph r45"><img src="/site/img/ariadne-t3-vine-1024x1280.webp" alt="Ariadne among vines in island light" /></div><figcaption><b>III</b> · The Vine</figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/ariadne-t3-shore-1536x1024.webp" alt="Ariadne on the shore in island light" /></div><figcaption><b>IV</b> · The Shore</figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/ariadne-r1-wine-1024x1280.webp" alt="Ariadne holding a glass of wine at a terrace table" /></div><figcaption><b>Range</b> · Wine</figcaption></figure>
          </div>
        </article>

        <article className="series">
          <div className="meta">
            <span className="sp-chip">Concept work</span>
            <h2>The Long <span className="l">Weekend</span></h2>
            <p className="muted">Saturday starts on the porch with coffee and the hydrangeas. The market, the kitchen, the bookshop, the coast road, then supper under string lights.</p>
            <dl><dt>Model</dt><dd>Beckie · BC01</dd><dt>Frames</dt><dd>6</dd><dt>Places</dt><dd>A seaside weekend</dd><dt>Lanes</dt><dd>Body care · Haircare · Plus-size fashion · Resortwear · Hospitality</dd></dl>
            <div className="ctas"><a className="pill" href="/m/beckie/">See Beckie</a></div>
          </div>
          <div className="g3">
            <figure><div className="ph r45"><img src="/site/img/beckie-t1-porch-1024x1280.webp" alt="Beckie on a porch in morning light" /></div><figcaption><b>I</b> · The Porch</figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/beckie-t3-kitchen-1024x1280.webp" alt="Beckie in a sunlit kitchen" /></div><figcaption><b>III</b> · The Kitchen</figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/beckie-t4-bookshop-1024x1280.webp" alt="Beckie in a small bookshop" /></div><figcaption><b>IV</b> · The Bookshop</figcaption></figure>
          </div>
        </article>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="head"><h2>Your brand, <span className="l">her world</span></h2><p>Send the product, the audience and where it will run. We place the face in a world built for it and license the result.</p></div>
          <div className="ctas"><Link className="pill lime" to="/brief">Start a brief</Link><Link className="pill" to="/proof">How we keep the face</Link></div>
        </div>
      </section>
    </div>
  )
}
