import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { usePaymentsStore } from '../store/payments'
import { useAccountsStore } from '../store/accounts'
import {
  formatCurrency,
  getGreetingName,
  isAccountOpen,
  accountStatusLabel,
  sumRubleBalance,
  normalizeCurrency,
  plural,
} from '../utils/format'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import '../styles/pages.css'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { payments, fetchPayments } = usePaymentsStore()
  const { accounts, loading: accountsLoading, fetchAccounts } = useAccountsStore()

  useEffect(() => {
    fetchPayments()
    fetchAccounts()
  }, [fetchPayments, fetchAccounts])

  // Складываем только рубли: валютные остатки без курса суммировать нельзя
  const totalBalance = sumRubleBalance(accounts)
  const openAccounts = accounts.filter(a => isAccountOpen(a.status))
  // Подпись под остатком должна считать те же счета, что и сам остаток,
  // иначе получается «3 рублёвых счёта» при одном рублёвом
  const rubleAccounts = openAccounts.filter(a => normalizeCurrency(a.currency) === 'RUB')
  const totalIncoming = payments.filter(p => p.amount > 0).reduce((s, p) => s + p.amount, 0)
  const totalOutgoing = payments.filter(p => p.amount < 0).reduce((s, p) => s + Math.abs(p.amount), 0)

  const today = format(new Date(), 'EEEE, d MMMM', { locale: ru })

  return (
    <div className="page">
      {/* Приветствие ужато в одну строку: на телефоне заголовок в две строки
          съедал четверть первого экрана до того, как показывались деньги */}
      <div className="dash-greeting">
        <span className="dash-greeting-name">{getGreetingName(user?.name)}</span>
        <span className="dash-greeting-date">{today}</span>
      </div>

      {/* Главное на экране — остаток. Обороты рядом, компактной строкой */}
      <div className="dash-hero">
        <div className="dash-hero-label">Остаток на счетах</div>
        <div className="dash-hero-value">
          {accountsLoading ? <span className="skeleton-line" /> : formatCurrency(totalBalance)}
        </div>
        <div className="dash-hero-meta">
          {rubleAccounts.length > 0
            ? `${rubleAccounts.length} ${plural(rubleAccounts.length, 'рублёвый счёт', 'рублёвых счёта', 'рублёвых счетов')}`
            + (openAccounts.length > rubleAccounts.length
              ? ` · ещё ${openAccounts.length - rubleAccounts.length} в валюте`
              : '')
            : 'нет рублёвых счетов'}
        </div>

        <div className="dash-flows">
          <div className="dash-flow">
            <span className="dash-flow-label">Поступления</span>
            <span className="dash-flow-value pos">
              {payments.length > 0 ? formatCurrency(totalIncoming) : '—'}
            </span>
          </div>
          <div className="dash-flow">
            <span className="dash-flow-label">Списания</span>
            <span className="dash-flow-value neg">
              {payments.length > 0 ? formatCurrency(-totalOutgoing) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Счета */}
      {accounts.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Счета</h2>
            <Link to="/accounts" className="section-action">Все</Link>
          </div>
          <div className="section-body">
            <div className="acc-list">
              {accounts.slice(0, 4).map((acc) => (
                <Link to="/accounts" key={acc.number} className="acc-row">
                  <span className="acc-badge">{normalizeCurrency(acc.currency)}</span>
                  <span className="acc-main">
                    {/* Показываем хвост номера: полные 20 цифр — шум на экране телефона */}
                    <span className="acc-number">·· {acc.number.slice(-4)}</span>
                    <span className="acc-status">{accountStatusLabel(acc.status)}</span>
                  </span>
                  <span className="acc-balance">{formatCurrency(acc.balance, acc.currency)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Быстрые действия</h2>
        </div>
        <div className="section-body" style={{ padding: '1rem 1.5rem' }}>
          <div className="quick-actions" style={{ margin: 0 }}>
            <Link to="/payments/create" className="quick-action">
              <div className="quick-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <span className="quick-action-label">Новый платеж</span>
            </Link>

            <Link to="/transfer" className="quick-action">
              <div className="quick-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </div>
              <span className="quick-action-label">Между счетами</span>
            </Link>

            <Link to="/statements" className="quick-action">
              <div className="quick-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="12" y2="17" />
                </svg>
              </div>
              <span className="quick-action-label">Выписка</span>
            </Link>

            <Link to="/contractors" className="quick-action">
              <div className="quick-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <span className="quick-action-label">Контрагент</span>
            </Link>

            <Link to="/analytics" className="quick-action">
              <div className="quick-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                  <line x1="2" y1="20" x2="22" y2="20" />
                </svg>
              </div>
              <span className="quick-action-label">Аналитика</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Последние платежи</h2>
          <Link to="/payments" className="section-link">Все платежи →</Link>
        </div>

        <div className="section-body">
          {payments.length > 0 ? (
            <div className="tx-list">
              {payments.slice(0, 5).map((payment) => (
                <Link key={payment.id} to={`/payments/${payment.id}`} className="tx-item">
                  <div className="tx-avatar">
                    {payment.recipient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="tx-info">
                    <div className="tx-name">{payment.recipient.name}</div>
                    <div className="tx-desc">{payment.purpose?.slice(0, 50) ?? payment.recipient.account}</div>
                  </div>
                  <div className="tx-right">
                    <div className="tx-amount" style={{ color: payment.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger, #e53e3e)' }}>
                      {payment.amount >= 0 ? '+' : ''}{formatCurrency(payment.amount)}
                    </div>
                    <div className="tx-date">
                      {format(new Date(payment.date), 'dd MMM', { locale: ru })}
                    </div>
                  </div>
                  <div style={{ marginLeft: '0.75rem' }}>
                    <span className={`badge badge-${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Платежей нет</div>
              <p className="empty-state-text">Создайте первый платеж</p>
              <Link to="/payments/create" className="btn btn-primary btn-sm">
                Создать платеж
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'gray',
    created: 'info',
    signed: 'warning',
    approved: 'warning',
    sent: 'info',
    executed: 'success',
    rejected: 'danger'
  }
  return colors[status] || 'gray'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Черновик',
    created: 'Создан',
    signed: 'Подписан',
    approved: 'Одобрен',
    sent: 'Отправлен',
    executed: 'Исполнен',
    rejected: 'Отклонён'
  }
  return labels[status] || status
}
