import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePaymentsStore } from '../store/payments'
import { formatCurrency } from '../utils/format'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import '../styles/pages.css'

// Фильтры статусов — как в веб-ДБО: Все, Выполненные, Черновики, На подпись,
// В обработке, Отклонённые.
const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: '',          label: 'Все' },
  { key: 'executed',  label: 'Выполненные' },
  { key: 'draft',     label: 'Черновики' },
  { key: 'created',   label: 'На подпись' },
  { key: 'sent',      label: 'В обработке' },
  { key: 'rejected',  label: 'Отклонённые' },
]

// Направление операции — тоже отдельный фильтр в ДБО
const DIRECTION_FILTERS: { key: string; label: string }[] = [
  { key: '',    label: 'Все операции' },
  { key: 'in',  label: 'Приход' },
  { key: 'out', label: 'Расход' },
]

export function PaymentsPage() {
  const { payments, fetchPayments, loading, documentsLoading } = usePaymentsStore()
  const [statusFilter, setStatusFilter] = useState('')
  const [directionFilter, setDirectionFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const isIncoming = (p: typeof payments[number]) => p.direction === 'in' || p.amount > 0

  const matchesSearch = (p: typeof payments[number]) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.recipient.name.toLowerCase().includes(q) ||
      (p.purpose ?? '').toLowerCase().includes(q) ||
      p.recipient.account.includes(q) ||
      (p.number ?? '').includes(q)
    )
  }

  const filteredPayments = payments.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false
    if (directionFilter === 'in' && !isIncoming(p)) return false
    if (directionFilter === 'out' && isIncoming(p)) return false
    return matchesSearch(p)
  })

  // Счётчики на чипах: сразу видно, есть ли документы на подпись
  const statusCount = (key: string) =>
    payments.filter(p => {
      if (key && p.status !== key) return false
      if (directionFilter === 'in' && !isIncoming(p)) return false
      if (directionFilter === 'out' && isIncoming(p)) return false
      return matchesSearch(p)
    }).length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Платежи</h1>
          <p className="page-subtitle">Управление и отслеживание платёжных операций</p>
        </div>
        <Link to="/payments/create" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Новый платёж
        </Link>
      </div>

      {/* Toolbar */}
      <div className="payments-toolbar">
        <div className="payments-toolbar-left">
          {STATUS_FILTERS.map(({ key, label }) => {
            const count = statusCount(key)
            return (
              <button
                key={key}
                className={`filter-chip ${statusFilter === key ? 'active' : ''}`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
                {count > 0 && <span className="filter-chip-count">{count}</span>}
              </button>
            )
          })}
        </div>
        <div className="payments-toolbar-left">
          {DIRECTION_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              className={`filter-chip ${directionFilter === key ? 'active' : ''}`}
              onClick={() => setDirectionFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="search-wrapper" style={{ marginBottom: 0, minWidth: 220 }}>
          <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            placeholder="Поиск по получателю..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Черновики приходят отдельным запросом к банку — это ещё до полутора
          минут. Без подсказки пустой список выглядит как сбой. */}
      {documentsLoading && (
        <div className="alert alert-info" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="spinner" />
          Загружаем черновики и документы на подпись из банка…
        </div>
      )}

      {/* Content */}
      <div className="section">
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner spinner-primary" style={{ width: 28, height: 28 }} />
          </div>
        ) : filteredPayments.length > 0 ? (
          <>
            <div className="section-header">
              <span className="section-title">
                {filteredPayments.length} {getCountLabel(filteredPayments.length)}
              </span>
            </div>
            <div className="tx-list">
              {filteredPayments.map((payment) => (
                <Link key={payment.id} to={`/payments/${payment.id}`} className="tx-item">
                  <div className="tx-avatar">
                    {payment.recipient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="tx-info">
                    <div className="tx-name">{payment.recipient.name}</div>
                    <div className="tx-desc">
                      {payment.purpose?.slice(0, 60) ?? payment.recipient.account}
                    </div>
                  </div>
                  <div className="tx-right">
                    <div className="tx-amount" style={{ color: payment.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger, #e53e3e)' }}>
                      {payment.amount >= 0 ? '+' : ''}{formatCurrency(payment.amount)}
                    </div>
                    <div className="tx-date">
                      {format(new Date(payment.date), 'dd MMM yyyy', { locale: ru })}
                    </div>
                  </div>
                  <div style={{ marginLeft: '0.75rem', flexShrink: 0 }}>
                    <span className={`badge badge-${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">
              {search ? 'Ничего не найдено' : statusFilter ? 'Платежей с таким статусом нет' : 'Платежей ещё нет'}
            </div>
            <p className="empty-state-text">
              {search
                ? 'Попробуйте изменить поисковый запрос'
                : statusFilter
                  ? 'Попробуйте изменить фильтр или сбросить его'
                  : 'Создайте первый платёж, чтобы он появился здесь'}
            </p>
            {!statusFilter && !search && (
              <Link to="/payments/create" className="btn btn-primary btn-sm">
                Создать платёж
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft:    'gray',
    created:  'info',
    signed:   'warning',
    approved: 'warning',
    sent:     'info',
    executed: 'success',
    rejected: 'error'
  }
  return colors[status] ?? 'gray'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft:    'Черновик',
    created:  'Создан',
    signed:   'Подписан',
    approved: 'Одобрен',
    sent:     'Отправлен',
    executed: 'Исполнен',
    rejected: 'Отклонён'
  }
  return labels[status] ?? status
}

function getCountLabel(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 19) return 'платежей'
  const r = n % 10
  if (r === 1) return 'платёж'
  if (r >= 2 && r <= 4) return 'платежа'
  return 'платежей'
}
