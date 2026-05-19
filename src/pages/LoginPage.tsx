import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Logo } from '../components/Logo'
import '../styles/pages.css'

export function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const authLogin = useAuthStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authLogin(login, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <>
      <div className="login-form-header">
        <h2 className="login-form-title">Вход в систему</h2>
        <p className="login-form-desc">Введите ваши учётные данные для входа</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="login">Логин</label>
          <input
            id="login"
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Введите логин"
            required
            disabled={loading}
            autoFocus
            autoComplete="username"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className="login-form-footer">
        <p>Тестовые данные: <strong>24cmvKy8</strong> / <strong>dbocib14Z</strong></p>
        <p style={{ marginTop: '0.375rem' }}>ПАО «Центр-инвест» · PWA v2.0</p>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop layout: 2 columns (≥960px) */}
      <div className="login-page login-page-desktop">
        {/* Left hero panel */}
        <div className="login-hero">
          <div className="login-hero-content">
            <div className="login-hero-logo">
              <Logo color="white" height={36} />
            </div>
            <p className="login-hero-subtitle">Дистанционное банковское обслуживание</p>

            <div className="login-hero-features">
              <div className="login-hero-feature">
                <div className="login-hero-feature-dot" />
                <span>Управление счетами и платежами</span>
              </div>
              <div className="login-hero-feature">
                <div className="login-hero-feature-dot" />
                <span>Подпись документов онлайн</span>
              </div>
              <div className="login-hero-feature">
                <div className="login-hero-feature-dot" />
                <span>Аналитика и выписки в реальном времени</span>
              </div>
              <div className="login-hero-feature">
                <div className="login-hero-feature-dot" />
                <span>Работа с контрагентами</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-form-side">
          <div className="login-form-container">
            {formContent}
          </div>
        </div>
      </div>

      {/* Mobile layout: single column with compact banner (<960px) */}
      <div className="login-page-mobile">
        {/* Compact green banner */}
        <div className="login-mobile-banner">
          <div className="login-mobile-banner-logo">
            <Logo color="white" height={28} />
          </div>
          <p className="login-mobile-banner-subtitle">ДБО Центр-инвест</p>
        </div>

        {/* Form */}
        <div className="login-form-container">
          {formContent}
        </div>
      </div>
    </>
  )
}
