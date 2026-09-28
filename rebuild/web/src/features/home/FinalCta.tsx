import { Link } from 'react-router-dom'

export function FinalCta() {
  return (
    <section className="section final" id="brief">
      <div className="final-glow" aria-hidden="true" />
      <div className="container final-inner">
        <h2 className="display final-title">
          Your next
          <br />
          campaign <em>starts here.</em>
        </h2>
        <p className="final-body">Tell us the brief — audience, usage, timeline. We match a face and quote it.</p>
        <div className="cta-row is-center">
          <Link to="/brief" className="btn btn-primary">
            Start a brief →
          </Link>
          <Link to="/models" className="btn btn-ghost">
            Browse models
          </Link>
        </div>
      </div>
    </section>
  )
}
