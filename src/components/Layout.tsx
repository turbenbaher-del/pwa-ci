import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Navigation } from './Navigation'
import { Header } from './Header'
import { MobileBottomNav } from './MobileBottomNav'
import '../styles/layout.css'

const pageTitles: Record<string, string> = {
  '/': 'Главная',
  '/accounts': 'Счета',
  '/payments': 'Платежи',
  '/payments/create': 'Новый платеж',
  '/statements': 'Выписки',
  '/contractors': 'Контрагенты',
  '/analytics': 'Аналитика',
  '/notifications': 'Уведомления',
  '/settings': 'Настройки'
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const currentTitle = pageTitles[location.pathname] ?? 'ДБО'

  return (
    <div className="layout">
      <Navigation
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title={currentTitle}
        />

        <div className="content-area">
          <Outlet />
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}
