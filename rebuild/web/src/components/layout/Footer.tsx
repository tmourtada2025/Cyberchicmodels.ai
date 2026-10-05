import { FACEBOOK_URL, INSTAGRAM_URL } from '../../config/site'
import { Wordmark } from './Wordmark'

// Each icon shows only while its URL is set in config/site.ts.
const SOCIAL = [
  {
    label: 'Instagram',
    url: INSTAGRAM_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    url: FACEBOOK_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.1v3h2.5V21h2.9z" />
      </svg>
    ),
  },
].filter((s) => s.url)

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-wordmark">
          <Wordmark />
        </div>
        {SOCIAL.length > 0 && (
          <nav className="footer-social" aria-label="Social">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`CyberChic on ${s.label}`}>
                {s.icon}
              </a>
            ))}
          </nav>
        )}
        <p className="footer-disclosure">AI models · No real person is depicted.</p>
      </div>
    </footer>
  )
}
