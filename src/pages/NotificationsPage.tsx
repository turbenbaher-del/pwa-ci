import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import '../styles/pages.css'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'danger'
  timestamp: Date
  read: boolean
}

const INITIAL: Notification[] = [
  { id: '1', title: 'Платёж исполнен', message: 'Платёж ООО Поставщик на сумму 50 000 ₽ успешно исполнен банком', type: 'success', timestamp: new Date(), read: false },
  { id: '2', title: 'Требуется подпись', message: 'Платёжное поручение №1547 ожидает вашей подписи', type: 'warning', timestamp: new Date(Date.now() - 3600000), read: false },
  { id: '3', title: 'Плановое обслуживание', message: 'Плановые технические работы завершены. Все сервисы работают в штатном режиме.', type: 'info', timestamp: new Date(Date.now() - 86400000), read: true },
]

const TYPE_COLORS: Record<string, string> = {
  success: 'var(--color-primary)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-error)',
  info: 'var(--color-info)',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  danger: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL)
  const unreadCount = notifications.filter(n => !n.read).length

  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const remove = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id))

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">
            Уведомления
            {unreadCount > 0 && (
              <span className="badge badge-error" style={{ marginLeft: '0.625rem', verticalAlign: 'middle', fontSize: '0.65rem' }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="page-subtitle">Системные оповещения и статусы операций</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-secondary btn-sm">
            Прочитать все
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="section">
          <div className="tx-list">
            {notifications.map((n) => (
              <div key={n.id} className="tx-item" style={{ alignItems: 'flex-start', background: n.read ? undefined : 'rgba(80,184,72,0.03)' }}>
                <div
                  className="tx-avatar"
                  style={{
                    background: `${TYPE_COLORS[n.type]}18`,
                    color: TYPE_COLORS[n.type],
                    border: `1px solid ${TYPE_COLORS[n.type]}30`,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {TYPE_ICONS[n.type]}
                </div>

                <div className="tx-info" style={{ flex: 1 }}>
                  <div className="tx-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {n.title}
                    {!n.read && (
                      <span style={{ width: 7, height: 7, background: 'var(--color-error)', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
                    )}
                  </div>
                  <div className="tx-desc" style={{ whiteSpace: 'normal', lineHeight: 1.5, marginTop: 3 }}>{n.message}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 5 }}>
                    {format(n.timestamp, 'dd MMM, HH:mm', { locale: ru })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', marginLeft: '0.75rem', flexShrink: 0 }}>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} className="btn btn-secondary btn-sm" title="Отметить как прочитанное" style={{ padding: '0.25rem 0.5rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  )}
                  <button onClick={() => remove(n.id)} className="btn btn-secondary btn-sm" title="Удалить" style={{ padding: '0.25rem 0.5rem', color: 'var(--color-error)', borderColor: 'transparent' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <div className="empty-state-title">Нет уведомлений</div>
          <p className="empty-state-text">Здесь будут появляться системные оповещения об операциях</p>
        </div>
      )}
    </div>
  )
}
