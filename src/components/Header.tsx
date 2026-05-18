import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'
import { Link } from 'react-router-dom'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const { isDark, toggleDark } = useThemeStore()

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-button hidden-desktop" onClick={onMenuClick} aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18M3 12h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <Link to="/" className="logo">
          <span className="logo-text">Центр-инвест</span>
        </Link>
      </div>

      <div className="header-right">
        <button
          onClick={toggleDark}
          className="icon-button"
          aria-label="Toggle dark mode"
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v6m0 6v6m11-11h-6m-6 0H1m15.657-6.657l-4.243 4.243m-2.828 2.828l-4.243 4.243M8.343 8.343l-4.243-4.243m2.828 2.828l4.243-4.243" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div className="user-menu">
          <button className="user-button">
            <div className="avatar">{user?.name.charAt(0).toUpperCase()}</div>
            <span className="hidden-mobile">{user?.name}</span>
          </button>

          <div className="dropdown-menu">
            <Link to="/settings">Настройки</Link>
            <Link to="/notifications">Уведомления</Link>
            <button onClick={logout}>Выход</button>
          </div>
        </div>
      </div>
    </header>
  )
}
