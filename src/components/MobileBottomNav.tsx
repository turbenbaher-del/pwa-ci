import { NavLink } from 'react-router-dom'
import '../styles/mobile-nav.css'

export function MobileBottomNav() {
  const items = [
    { path: '/', label: 'Главная', icon: '📊' },
    { path: '/payments', label: 'Платежи', icon: '💳' },
    { path: '/contractors', label: 'Контрагенты', icon: '👥' },
    { path: '/statements', label: 'Выписки', icon: '📋' },
    { path: '/notifications', label: 'Уведомления', icon: '🔔' }
  ]

  return (
    <nav className="mobile-bottom-nav hidden-desktop">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="mobile-nav-icon">{item.icon}</span>
          <span className="mobile-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
