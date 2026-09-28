import { Link } from 'react-router-dom'

// sm (nav) is below the Anton floor, so it uses the Inter label style; lg (footer) is display size.
export function Wordmark({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const type = size === 'lg' ? 'display wordmark-lg' : 'label wordmark-sm'
  return (
    <Link to="/" className={`wordmark ${type}`} aria-label="CyberChic home">
      CYBER<span className="wordmark-accent">CHIC</span>
    </Link>
  )
}
