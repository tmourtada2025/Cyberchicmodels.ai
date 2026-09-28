import { Wordmark } from './Wordmark'

// Create enforces its own admin login server-side; this is only a doorway to it.
const CREATE_URL = import.meta.env.VITE_CREATE_URL

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-wordmark">
          <Wordmark size="lg" />
        </div>
        <p className="footer-disclosure">AI models · No real person is depicted.</p>
        {CREATE_URL && (
          <a href={`${CREATE_URL.replace(/\/$/, '')}/login`} className="label footer-admin" rel="nofollow">
            Admin
          </a>
        )}
      </div>
    </footer>
  )
}
