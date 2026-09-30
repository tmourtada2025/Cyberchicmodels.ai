import { Link } from 'react-router-dom'

// The wordmark is the logo: always Anton, exempt from the small=Inter rule (visual-lock §1).
export function Wordmark() {
  return (
    <Link to="/" className="wordmark display" aria-label="CyberChic home">
      CYBER<span className="wordmark-accent">CHIC</span>
    </Link>
  )
}
