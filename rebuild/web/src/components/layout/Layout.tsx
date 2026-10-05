import { useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useImageProtection } from '../../hooks/useImageProtection'
import { Footer } from './Footer'
import { Nav } from './Nav'
import './layout.css'

export function Layout() {
  const { pathname } = useLocation()
  useImageProtection()

  // Every route change starts at the top. The browser's own restoration is off: on Back it re-applied a
  // stale offset after this reset, clamped by the half-loaded page, and landed mid-page.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  }, [])

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="shell">
      <Nav />
      <main className="shell-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
