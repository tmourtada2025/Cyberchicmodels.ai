import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { NAV_LINKS, PRIMARY_CTA } from '../../config/nav'
import { Wordmark } from './Wordmark'

type NavProps = {
  // "Casting open" pulse. Must be driven by a real open casting window (visual-lock §4/§5) —
  // no data source exists yet, so it stays hidden until one is wired.
  castingOpen?: boolean
}

export function Nav({ castingOpen = false }: NavProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Wordmark />

        <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav-link label" onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          {castingOpen && (
            <span className="casting-dot label">
              <span className="casting-dot-pulse" aria-hidden="true" />
              Casting open
            </span>
          )}
          <Link to={PRIMARY_CTA.to} className="btn btn-primary">
            {PRIMARY_CTA.label}
          </Link>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}
