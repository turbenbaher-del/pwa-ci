import { useAuthStore } from '../store/auth'
import { Link } from 'react-router-dom'
import { toTitleCase } from '../utils/format'

interface HeaderProps {
  onMenuClick: () => void
  title?: string
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { user, logout } = useAuthStore()

  const initials = user?.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('') ?? '?'

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={onMenuClick}
          aria-label="Меню"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="header-breadcrumb">
          <span>ДБО</span>
          <span className="header-breadcrumb-sep">›</span>
          <span className="header-breadcrumb-current">{title}</span>
        </div>
      </div>

      <div className="header-right">
        <Link to="/payments/create" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Платеж
        </Link>

        <Link to="/notifications" className="header-icon-btn" title="Уведомления">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              background: 'var(--color-error)',
              borderRadius: '50%',
              border: '2px solid var(--color-surface)'
            }}
          />
        </Link>

        <button
          className="header-user-btn"
          onClick={logout}
          title="Выйти"
          style={{ cursor: 'pointer' }}
        >
          <div className="avatar avatar-sm">{initials}</div>
          <span className="header-user-name">{user?.name ? toTitleCase(user.name) : ''}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </header>
  )
}
