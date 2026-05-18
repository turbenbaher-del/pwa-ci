import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
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

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Центр-инвест</h1>
          <p>ДБО для управления финансами</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-danger">{error}</div>}

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
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <span className="spinner"></span> : null}
            Войти
          </button>
        </form>

        <div className="login-footer">
          <p>Тестовые данные: 24cmvKy8 / dbocib14Z</p>
          <p className="text-gray" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
            PWA версия ДБО "Центр-инвест"
          </p>
        </div>
      </div>
    </div>
  )
}
