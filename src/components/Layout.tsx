import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Navigation } from './Navigation'
import { Header } from './Header'
import { MobileBottomNav } from './MobileBottomNav'
import '../styles/layout.css'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="layout">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="layout-body">
        <Navigation open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="layout-main">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  )
}
