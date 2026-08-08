import { useEffect, useState } from 'react'
import { apiFetch, friendlyError } from '../utils/api'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import '../styles/pages.css'

interface AuditEntry {
  at: string
  event: string
  result: 'ok' | 'error' | 'info'
  [key: string]: any
}

// Человеческие названия событий. Журнал читает владелец, а не разработчик,
// поэтому «sign.key» ему ничего не говорит.
const EVENT_NAMES: Record<string, string> = {
  'auth.login': 'Вход в приложение',
  'auth.logout': 'Выход',
  'auth.expired': 'Сессия завершена по бездействию',
  'transfer.create': 'Создание перевода',
  'sign.start': 'Начало подписи',
  'sign.key': 'Ввод ключа с токена',
  'sign.sync': 'Синхронизация токена',
  'sign.cancel': 'Отмена подписи',
  'sign.finish': 'Завершение подписи',
}

const RESULT_STYLE: Record<string, { label: string; cls: string }> = {
  ok:    { label: 'успешно',  cls: 'badge-success' },
  error: { label: 'ошибка',   cls: 'badge-error' },
  info:  { label: 'начато',   cls: 'badge-neutral' },
}

export function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true); setError('')
    apiFetch('/api/audit?limit=200')
      .then(res => setEntries(res.data ?? []))
      .catch(e => setError(friendlyError(e, 'Не удалось загрузить журнал')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Подробности события: сумма, счета, документ, текст ошибки банка
  const describe = (e: AuditEntry): string => {
    const parts: string[] = []
    if (e.amount != null) parts.push(`${e.amount} ₽`)
    if (e.fromAccount) parts.push(`со счёта ${e.fromAccount}`)
    if (e.toAccount) parts.push(`на счёт ${e.toAccount}`)
    if (e.serial) parts.push(`токен ${e.serial}`)
    if (e.name) parts.push(e.name)
    if (e.message) parts.push(e.message)
    if (e.error) parts.push(e.error)
    if (e.reason) parts.push(e.reason)
    return parts.join(' · ')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Журнал действий</h1>
          <p className="page-subtitle">
            Что происходило в приложении: входы, переводы и шаги подписи
          </p>
        </div>
      </div>

      <div className="an-card" style={{ marginBottom: 12 }}>
        <div className="an-party-meta" style={{ lineHeight: 1.5 }}>
          Пароль, ключи с токена и коды подтверждения в журнал не записываются.
          Номера счетов показаны последними четырьмя цифрами. Журнал хранится
          до перезапуска сервиса.
        </div>
      </div>

      {loading && <div className="an-empty"><span className="spinner" /> Загружаем журнал…</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && entries.length === 0 && (
        <div className="an-empty">Записей пока нет</div>
      )}

      {entries.length > 0 && (
        <div className="tx-list">
          {entries.map((e, i) => {
            const style = RESULT_STYLE[e.result] ?? RESULT_STYLE.info
            const details = describe(e)
            return (
              <div className="tx-item" key={`${e.at}-${i}`}>
                <div className="tx-info">
                  <div className="tx-desc" style={{ whiteSpace: 'normal' }}>
                    {EVENT_NAMES[e.event] ?? e.event}
                  </div>
                  {details && (
                    <div className="tx-date" style={{ whiteSpace: 'normal' }}>{details}</div>
                  )}
                  <div className="tx-date">
                    {format(new Date(e.at), 'd MMM yyyy, HH:mm:ss', { locale: ru })}
                  </div>
                </div>
                <div style={{ marginLeft: '0.75rem', flexShrink: 0 }}>
                  <span className={`badge ${style.cls}`}>{style.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button className="btn btn-secondary btn-block" style={{ marginTop: '1rem' }} onClick={load} disabled={loading}>
        Обновить
      </button>
    </div>
  )
}
