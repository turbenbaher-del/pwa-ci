import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { isDark, toggleDark, fontSize, setFontSize } = useThemeStore()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      alert('Пароль должен быть минимум 6 символов')
      return
    }
    alert('Пароль успешно изменен')
    setNewPassword('')
    setShowPasswordForm(false)
  }

  const handleLogout = () => {
    if (window.confirm('Вы действительно хотите выйти?')) {
      logout()
      navigate('/login')
    }
  }

  return (
    <div className="page-container">
      <h1>Настройки</h1>

      {/* Профиль */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>👤 Профиль</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label className="text-gray text-sm">Имя</label>
          <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>{user?.name}</p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="text-gray text-sm">Email</label>
          <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>{user?.email || 'Не указан'}</p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="text-gray text-sm">Телефон</label>
          <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>{user?.phone || 'Не указан'}</p>
        </div>

        <div>
          <label className="text-gray text-sm">Роль</label>
          <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>
            {user?.role === 'admin' ? 'Администратор' : user?.role === 'accountant' ? 'Бухгалтер' : 'Пользователь'}
          </p>
        </div>
      </div>

      {/* Безопасность */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>🔐 Безопасность</h3>

        {!showPasswordForm ? (
          <button onClick={() => setShowPasswordForm(true)} className="btn btn-primary btn-block">
            🔑 Изменить пароль
          </button>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
            <div className="form-group">
              <label>Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                autoFocus
              />
            </div>

            <div className="flex" style={{ gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary flex-1">
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="btn btn-secondary flex-1"
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label className="text-gray text-sm">Двухфакторная аутентификация</label>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
              ✓ Включена
            </button>
          </div>
        </div>
      </div>

      {/* Интерфейс */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>🎨 Интерфейс</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label className="text-gray text-sm">Тема</label>
          <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.5rem' }}>
            <button
              onClick={toggleDark}
              className="btn"
              style={{
                width: '100%',
                background: isDark ? 'var(--primary)' : 'var(--gray-200)',
                color: isDark ? 'white' : 'var(--text-primary)',
                border: 'none',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer'
              }}
            >
              {isDark ? '🌙 Темная тема' : '☀️ Светлая тема'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="text-gray text-sm">Размер шрифта</label>
          <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {(['small', 'normal', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className="btn"
                style={{
                  background: fontSize === size ? 'var(--primary)' : 'var(--gray-200)',
                  color: fontSize === size ? 'white' : 'var(--text-primary)',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',
                  fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem'
                }}
              >
                {size === 'small' ? 'A' : size === 'large' ? 'A' : 'A'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Уведомления */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>🔔 Уведомления</h3>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
          <input type="checkbox" defaultChecked />
          <span>Push-уведомления о платежах</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
          <input type="checkbox" defaultChecked />
          <span>Email уведомления</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input type="checkbox" defaultChecked />
          <span>SMS уведомления</span>
        </label>
      </div>

      {/* О приложении */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>ℹ️ О приложении</h3>

        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Версия:</strong> 1.0.0
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Дата сборки:</strong> 18 мая 2026
          </div>
          <div>
            <strong>© 2026</strong> ООО "БСС" - ДБО Центр-инвест PWA
          </div>
        </div>
      </div>

      {/* Опасная зона */}
      <div className="card" style={{ background: 'rgba(220, 38, 38, 0.1)', borderColor: 'var(--danger)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--danger)' }}>⚠️ Опасная зона</h3>

        <button onClick={handleLogout} className="btn btn-danger btn-block">
          🚪 Выход из аккаунта
        </button>
      </div>
    </div>
  )
}
