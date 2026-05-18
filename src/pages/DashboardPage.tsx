import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { usePaymentsStore } from '../store/payments'
import { formatCurrency } from '../utils/format'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { payments, fetchPayments } = usePaymentsStore()

  useEffect(() => {
    fetchPayments({ status: 'sent' })
  }, [fetchPayments])

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const pendingCount = payments.filter(p => p.status === 'created' || p.status === 'signed').length

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Добро пожаловать, {user?.name}!</h1>
        <p className="text-gray">Обзор вашей деятельности</p>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <div className="card-header">
            <h3>Платежей отправлено</h3>
            <span className="icon">📤</span>
          </div>
          <div className="card-value">{payments.length}</div>
          <div className="card-footer">Всего операций</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Общая сумма</h3>
            <span className="icon">💰</span>
          </div>
          <div className="card-value">{formatCurrency(totalAmount)}</div>
          <div className="card-footer">За период</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>На подпись</h3>
            <span className="icon">✍️</span>
          </div>
          <div className="card-value text-warning">{pendingCount}</div>
          <div className="card-footer">Требует действия</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Последние платежи</h2>
          <Link to="/payments" className="link-secondary">Все платежи →</Link>
        </div>

        {payments.length > 0 ? (
          <div className="payments-list">
            {payments.slice(0, 5).map((payment) => (
              <Link key={payment.id} to={`/payments/${payment.id}`} className="payment-item">
                <div className="payment-info">
                  <div className="payment-recipient">
                    <strong>{payment.recipient.name}</strong>
                    <span className="text-gray">{payment.recipient.account}</span>
                  </div>
                  <div className="payment-date">
                    {format(new Date(payment.date), 'dd MMM yyyy', { locale: ru })}
                  </div>
                </div>
                <div className="payment-amount">
                  <strong>{formatCurrency(payment.amount)}</strong>
                  <span className={`badge badge-${getStatusColor(payment.status)}`}>
                    {getStatusLabel(payment.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="text-gray">Платежей не найдено</p>
            <Link to="/payments/create" className="btn btn-primary btn-sm">
              Создать платеж
            </Link>
          </div>
        )}
      </div>

      <div className="section">
        <h2>Быстрые действия</h2>
        <div className="grid grid-2">
          <Link to="/payments/create" className="action-card">
            <span className="action-icon">➕</span>
            <span className="action-label">Новый платеж</span>
          </Link>
          <Link to="/statements" className="action-card">
            <span className="action-icon">📄</span>
            <span className="action-label">Выписка</span>
          </Link>
          <Link to="/contractors" className="action-card">
            <span className="action-icon">👥</span>
            <span className="action-label">Контрагенты</span>
          </Link>
          <Link to="/analytics" className="action-card">
            <span className="action-icon">📊</span>
            <span className="action-label">Аналитика</span>
          </Link>
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
    rejected: 'Отклонен'
  }
  return labels[status] || status
}
