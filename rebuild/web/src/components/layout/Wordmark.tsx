import { Link } from 'react-router-dom'

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`wordmark display ${className}`} aria-label="CyberChic home">
      CYBER<span className="wordmark-accent">CHIC</span>
    </Link>
  )
}
