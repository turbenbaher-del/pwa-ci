import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePaymentsStore } from '../store/payments'
import { formatCurrency } from '../utils/format'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function PaymentsPage() {
  const { payments, fetchPayments, loading } = usePaymentsStore()
  const [filters, setFilters] = useState({ status: '' })

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const filteredPayments = payments.filter(p => !filters.status || p.status === filters.status)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Платежи</h1>
        <p className="text-gray">Управление и отслеживание платежей</p>
      </div>

      <div className="flex" style={{ gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        <div className="flex" style={{ gap: '0.75rem' }}>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--gray-300)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Все статусы</option>
            <option value="draft">Черновик</option>
            <option value="created">Создан</option>
            <option value="signed">Подписан</option>
            <option value="sent">Отправлен</option>
            <option value="executed">Исполнен</option>
          </select>
        </div>

        <Link to="/payments/create" className="btn btn-primary">
          ➕ Новый платеж
        </Link>
      </div>

      {loading && <div className="text-center">Загрузка...</div>}

      {!loading && filteredPayments.length > 0 ? (
        <div className="payments-list">
          {filteredPayments.map((payment) => (
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
      ) : !loading ? (
        <div className="empty-state">
          <p className="text-gray">Платежей не найдено</p>
          <Link to="/payments/create" className="btn btn-primary btn-sm">
            Создать первый платеж
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'gray',
    created: 'info',
    signed: 'warning',
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
    sent: 'Отправлен',
    executed: 'Исполнен',
    rejected: 'Отклонен'
  }
  return labels[status] || status
}
