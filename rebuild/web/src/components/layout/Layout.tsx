import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from './Footer'
import { Nav } from './Nav'
import './layout.css'

export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
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
