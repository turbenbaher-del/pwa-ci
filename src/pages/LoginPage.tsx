import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Logo } from '../components/Logo'
import {
  isBiometricSupported, isBiometricEnabled, unlockWithBiometric,
  enableBiometric, biometricName,
} from '../utils/biometric'
import '../styles/pages.css'

export function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const authLogin = useAuthStore((state) => state.login)
  const loginDemo = useAuthStore((state) => state.loginDemo)

  // Вход по Face ID / отпечатку
  const [bioReady, setBioReady] = useState(false)      // настроен на устройстве
  const [bioOffer, setBioOffer] = useState(false)      // можно предложить включить
  const [bioBusy, setBioBusy] = useState(false)
  const bioName = biometricName()

  useEffect(() => {
    isBiometricSupported().then(async supported => {
      if (!supported) return
      const enabled = await isBiometricEnabled()
      setBioReady(enabled)
      setBioOffer(!enabled)
    })
  }, [])

  // Настроенный вход просим сразу: человек открыл приложение, чтобы войти,
  // а не чтобы сначала нажать лишнюю кнопку.
  useEffect(() => {
    if (bioReady) handleBiometric()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bioReady])

  const handleBiometric = async () => {
    setBioBusy(true); setError('')
    try {
      const creds = await unlockWithBiometric()
      await authLogin(creds.login, creds.password)
      navigate('/')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось войти по биометрии'
      // «Отменён» — это осознанное действие человека, а не сбой: не пугаем
      if (msg !== 'Вход отменён') setError(msg)
      setBioReady(await isBiometricEnabled())
    } finally {
      setBioBusy(false)
    }
  }

  const handleDemo = () => {
    loginDemo()
    navigate('/payments/create')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authLogin(login, password)
      // Предлагаем включить биометрию только после УДАЧНОГО входа: иначе
      // сохранили бы неверный пароль и потом входили бы им по Face ID.
      if (bioOffer) {
        const yes = window.confirm(
          `Входить по ${bioName} в следующий раз?

` +
          'Логин и пароль сохранятся на этом устройстве в зашифрованном виде ' +
          'и будут доступны только после подтверждения личности.'
        )
        if (yes) {
          try { await enableBiometric(login, password) } catch { /* отказ — не мешаем входу */ }
        }
      }
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

      {/* Настроенный вход по биометрии — первым: он и есть основной способ */}
      {bioReady && (
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleBiometric}
            disabled={bioBusy || loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {bioBusy ? <span className="spinner" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 11v2a9 9 0 0 1-.5 3" />
                <path d="M8.5 8.5a5 5 0 0 1 7 4.5v1" />
                <path d="M5 12a7 7 0 0 1 3-5.8" />
                <path d="M16 6.2A7 7 0 0 1 19 12v1.5" />
                <path d="M8 20a12 12 0 0 0 1-4.5V13" />
                <path d="M15.5 19.5a16 16 0 0 0 .8-4" />
              </svg>
            )}
            Войти по {bioName}
          </button>
          <div style={{
            textAlign: 'center', margin: '0.875rem 0 0',
            fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
          }}>
            или введите логин и пароль
          </div>
        </div>
      )}

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

        <div className="login-demo-divider"><span>или</span></div>

        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={handleDemo}
          disabled={loading}
        >
          Войти в демо-режиме
        </button>
        <p className="login-demo-note">Без входа в банк — прокликать интерфейс на тестовых данных</p>
      </form>

      <div className="login-form-footer">
        {/* Здесь были напечатаны реальные логин и пароль ДБО — на общедоступной
            странице. Никаких учётных данных на экране входа быть не должно. */}
        <p>ПАО «Центр-инвест» · PWA v2.0</p>
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
