import { Link } from 'react-router-dom'
import { BOOKING_EMAIL, FACEBOOK_URL, INSTAGRAM_URL } from '../../config/site'
import { Wordmark } from './Wordmark'

// Footer per legal/site-footer-privacy-licensing-brief.md §1. Static content only (no data), so its
// height is fixed from first paint. The year is static text: update it each January.
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-wordmark">
          <Wordmark />
        </div>
        <p className="footer-disclosure">AI-generated models and music. No real person is depicted.</p>
        <p className="footer-links label">
          <a href={`mailto:${BOOKING_EMAIL}`} className="footer-email">
            {BOOKING_EMAIL}
          </a>
          <span aria-hidden="true"> · </span>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <span aria-hidden="true"> · </span>
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
        </p>
        <p className="footer-legal">
          <span>© 2026 CyberChic Models, operated by Toufic Mourtada, Beirut, Lebanon</span>
          <span aria-hidden="true"> · </span>
          <Link to="/privacy" className="label">
            Privacy
          </Link>
          <span aria-hidden="true"> · </span>
          <Link to="/licensing" className="label">
            Licensing terms
          </Link>
        </p>
      </div>
    </footer>
  )
}
