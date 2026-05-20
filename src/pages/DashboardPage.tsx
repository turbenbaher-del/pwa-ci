import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { usePaymentsStore } from '../store/payments'
import { useAccountsStore } from '../store/accounts'
import { formatCurrency, getFirstName } from '../utils/format'
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

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const openAccounts = accounts.filter(a => a.status === 'Открыт')
  const pendingCount = payments.filter(p => p.status === 'created' || p.status === 'signed' || p.status === 'draft').length
  const executedCount = payments.filter(p => p.status === 'executed' || (p.status as string) === 'ГО').length
  const totalIncoming = payments.filter(p => p.amount > 0).reduce((s, p) => s + p.amount, 0)
  const totalOutgoing = payments.filter(p => p.amount < 0).reduce((s, p) => s + Math.abs(p.amount), 0)

  const today = format(new Date(), 'EEEE, d MMMM', { locale: ru })

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Добро пожаловать, {user?.name ? getFirstName(user.name) : ''}!</h1>
        <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-card-label">Общий остаток</div>
          <div className="kpi-card-value">
            {accountsLoading ? '...' : formatCurrency(totalBalance)}
          </div>
          <div className="kpi-card-meta">По всем счетам (RUR)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div className="kpi-card-label">Поступления</div>
          <div className="kpi-card-value" style={{ fontSize: '1rem' }}>
            {payments.length > 0 ? formatCurrency(totalIncoming) : '—'}
          </div>
          <div className="kpi-card-meta">За период</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          </div>
          <div className="kpi-card-label">Списания</div>
          <div className="kpi-card-value" style={{ fontSize: '1rem' }}>
            {payments.length > 0 ? formatCurrency(totalOutgoing) : '—'}
          </div>
          <div className="kpi-card-meta">За период</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <div className="kpi-card-label">Счетов</div>
          <div className="kpi-card-value">
            {accountsLoading ? '...' : openAccounts.length}
          </div>
          <div className="kpi-card-meta">Активных</div>
        </div>
      </div>

      {/* Accounts list */}
      {accounts.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Счета</h2>
          </div>
          <div className="section-body">
            <div className="tx-list">
              {accounts.map((acc) => (
                <div key={acc.number} className="tx-item">
                  <div className="tx-avatar" style={{ fontSize: '0.7rem', letterSpacing: '-0.5px' }}>
                    {acc.currency}
                  </div>
                  <div className="tx-info">
                    <div className="tx-name" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {acc.number.replace(/(\d{5})(\d{3})(\d)(\d{11})/, '$1.$2.$3.$4')}
                    </div>
                    <div className="tx-desc">{acc.status}</div>
                  </div>
                  <div className="tx-right">
                    <div className="tx-amount">{formatCurrency(acc.balance)}</div>
                    <div className="tx-date">{acc.currency}</div>
                  </div>
                </div>
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
