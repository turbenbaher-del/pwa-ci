import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'
import { toTitleCase } from '../utils/format'
import '../styles/pages.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { isDark, toggleDark, fontSize, setFontSize } = useThemeStore()
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sectionStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: '1.25rem',
    overflow: 'hidden' as const,
  }

  const sectionHeader = {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid var(--color-border-light)',
    fontFamily: 'var(--font-primary)',
    fontWeight: 600 as const,
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }

  const sectionBody = { padding: '1.25rem 1.5rem' }

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.875rem',
    marginBottom: '0.875rem',
    borderBottom: '1px solid var(--color-border-light)',
  }

  const labelStyle = { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }
  const valueStyle = { fontFamily: 'var(--font-primary)', fontWeight: 500, fontSize: 'var(--text-sm)' }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Настройки</h1>
        <p className="page-subtitle">Управление аккаунтом и параметрами приложения</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Profile */}
        <div style={sectionStyle}>
          <div style={sectionHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Профиль
          </div>
          <div style={sectionBody}>
            {[
              { label: 'Имя', value: user?.name ? toTitleCase(user.name) : '—' },
              { label: 'Логин', value: user?.login || '—' },
              { label: 'Роль', value: user?.role === 'admin' ? 'Администратор' : user?.role === 'accountant' ? 'Бухгалтер' : 'Пользователь' },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{ ...rowStyle, ...(i === arr.length - 1 ? { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } : {}) }}>
                <span style={labelStyle}>{label}</span>
                <span style={valueStyle}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div style={sectionStyle}>
          <div style={sectionHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Безопасность
          </div>
          <div style={sectionBody}>
            {/* Здесь стояла форма смены пароля, которая ничего не меняла: она
                просто писала «Пароль успешно изменён». В банковском приложении
                это опаснее отсутствия функции — человек поверит, что сменил
                пароль от банка. Пароль меняется только в самом ДБО. */}
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.5 }}>
              Пароль и способ подтверждения операций меняются в интернет-банке
              «Центр-инвест». Приложение работает через ваш вход в ДБО и своих
              паролей не хранит.
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.875rem' }}>
              <a
                href="https://dbo.centrinvest.ru/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: 'none', display: 'inline-flex' }}
              >
                Открыть ДБО
              </a>
              {/* Журнал нужен, когда что-то пошло не так: видно, что делалось
                  и что ответил банк. Секретов в нём нет. */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/audit')}
              >
                Журнал действий
              </button>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <span style={labelStyle}>Подтверждение операций</span>
              {/* Раньше здесь горело «Двухфакторная аутентификация: включена» —
                  в приложении её нет вовсе, подтверждение запрашивает банк */}
              <span className="badge badge-neutral" style={{ flexShrink: 0 }}>на стороне банка</span>
            </div>
          </div>
        </div>

        {/* Interface */}
        <div style={sectionStyle}>
          <div style={sectionHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
            Интерфейс
          </div>
          <div style={sectionBody}>
            <div style={{ ...rowStyle }}>
              <span style={labelStyle}>Тема оформления</span>
              <button
                onClick={toggleDark}
                className={`btn btn-sm ${isDark ? 'btn-primary' : 'btn-secondary'}`}
              >
                {isDark ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    Тёмная
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    Светлая
                  </>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={labelStyle}>Размер шрифта</span>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {(['small', 'normal', 'large'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`btn btn-sm ${fontSize === size ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ minWidth: 38, fontSize: size === 'small' ? '0.7rem' : size === 'large' ? '0.95rem' : '0.8rem' }}
                  >
                    A
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div style={sectionStyle}>
          <div style={sectionHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            О приложении
          </div>
          <div style={sectionBody}>
            {[
              { label: 'Версия', value: 'PWA 2.0' },
              // Дата подставляется при сборке, а не вписывается руками
              { label: 'Дата сборки', value: format(new Date(__BUILD_DATE__), 'd MMMM yyyy, HH:mm', { locale: ru }) },
              { label: 'Банк', value: 'ПАО «Центр-инвест»' },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{ ...rowStyle, ...(i === arr.length - 1 ? { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } : {}) }}>
                <span style={labelStyle}>{label}</span>
                <span style={valueStyle}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="btn btn-danger btn-block">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}
