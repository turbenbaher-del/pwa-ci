import { useState } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'danger'
  timestamp: Date
  read: boolean
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Платеж исполнен',
      message: 'Платеж ООО Поставщик на сумму 50 000 ₽ успешно исполнен',
      type: 'success',
      timestamp: new Date(),
      read: false
    },
    {
      id: '2',
      title: 'Требуется подпись',
      message: 'Платеж ИП Клиент требует вашей подписи',
      type: 'warning',
      timestamp: new Date(Date.now() - 3600000),
      read: false
    },
    {
      id: '3',
      title: 'Информация',
      message: 'Плановое обслуживание системы завершено',
      type: 'info',
      timestamp: new Date(Date.now() - 86400000),
      read: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getIconByType = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'danger': return '❌'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 60) return `${minutes} мин назад`
    if (hours < 24) return `${hours}ч назад`
    if (days < 7) return `${days}д назад`
    return date.toLocaleDateString('ru-RU')
  }

  return (
    <div className="page-container">
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Уведомления</h1>
        {unreadCount > 0 && (
          <span style={{
            background: 'var(--danger)',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            {unreadCount} новых
          </span>
        )}
      </div>

      {notifications.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="card"
              style={{
                background: notification.read ? 'var(--bg-primary)' : 'var(--gray-50)',
                borderLeft: `4px solid var(--${notification.type})`
              }}
            >
              <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div className="flex" style={{ gap: '0.75rem', alignItems: 'start' }}>
                    <span style={{ fontSize: '1.25rem' }}>{getIconByType(notification.type)}</span>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>
                        {notification.title}
                        {!notification.read && (
                          <span style={{
                            marginLeft: '0.5rem',
                            width: '8px',
                            height: '8px',
                            background: 'var(--danger)',
                            borderRadius: '50%',
                            display: 'inline-block'
                          }}></span>
                        )}
                      </h4>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
                        {notification.message}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex" style={{ gap: '0.5rem', marginLeft: '1rem' }}>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="btn btn-secondary btn-sm"
                      title="Отметить как прочитанное"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="btn btn-danger btn-sm"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="text-gray">Нет уведомлений</p>
        </div>
      )}
    </div>
  )
}
