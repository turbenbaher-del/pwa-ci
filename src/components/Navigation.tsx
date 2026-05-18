import { NavLink } from 'react-router-dom'
import '../styles/navigation.css'

interface NavigationProps {
  open: boolean
  onClose: () => void
}

export function Navigation({ open, onClose }: NavigationProps) {
  const navItems = [
    { path: '/', label: 'Главная', icon: '📊' },
    { path: '/payments', label: 'Платежи', icon: '💳' },
    { path: '/contractors', label: 'Контрагенты', icon: '👥' },
    { path: '/statements', label: 'Выписки', icon: '📋' },
    { path: '/analytics', label: 'Аналитика', icon: '📈' },
    { path: '/notifications', label: 'Уведомления', icon: '🔔' },
    { path: '/settings', label: 'Настройки', icon: '⚙️' }
  ]

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
