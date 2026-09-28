import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Nav } from './Nav'
import './layout.css'

export function Layout() {
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
