import { Link } from 'react-router-dom'
import './placeholder.css'

type PlaceholderPageProps = {
  eyebrow: string
  title: string
  body?: string
}

// Minimal titled page so nav targets resolve visibly; real pages land in later stages.
export function PlaceholderPage({ eyebrow, title, body = 'This page is being built.' }: PlaceholderPageProps) {
  return (
    <section className="placeholder">
      <div className="container">
        <span className="eyebrow label">{eyebrow}</span>
        <h1 className="display placeholder-title">{title}</h1>
        <p className="placeholder-body">{body}</p>
        <Link to="/" className="btn btn-ghost">
          ← Back to home
        </Link>
      </div>
    </section>
  )
}
