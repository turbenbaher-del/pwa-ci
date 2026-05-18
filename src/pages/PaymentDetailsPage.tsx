import { useParams, useNavigate } from 'react-router-dom'
import { usePaymentsStore } from '../store/payments'
import { formatCurrency } from '../utils/format'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useState } from 'react'

export function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getPaymentById, updatePayment, signPayment } = usePaymentsStore()
  const [showSignForm, setShowSignForm] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')

  const payment = id ? getPaymentById(id) : undefined

  if (!payment) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">Платеж не найден</div>
      </div>
    )
  }

  const handleSign = async () => {
    if (twoFactorCode.length !== 6) {
      alert('Введите 6-значный код')
      return
    }

    try {
      await signPayment(payment.id, 'signature_placeholder', twoFactorCode)
      setShowSignForm(false)
      alert('Платеж подписан успешно')
    } catch (error) {
      alert('Ошибка при подписании платежа')
    }
  }

  return (
    <div className="page-container">
      <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1>Детали платежа</h1>
        <button onClick={() => navigate('/payments')} className="btn btn-secondary">
          ← Назад
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="card">
          <div className="card-header">
            <h3>Статус платежа</h3>
            <span className={`badge badge-${getStatusColor(payment.status)}`}>
              {getStatusLabel(payment.status)}
            </span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="text-gray" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Идентификатор
            </label>
            <strong>{payment.id}</strong>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="text-gray" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Сумма
            </label>
            <strong style={{ fontSize: '1.25rem' }}>
              {formatCurrency(payment.amount)}
            </strong>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="text-gray" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Дата платежа
            </label>
            <strong>{format(new Date(payment.date), 'dd MMMM yyyy', { locale: ru })}</strong>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="text-gray" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Приоритет
            </label>
            <strong>{payment.priority === 'normal' ? 'Обычный' : 'Срочный'}</strong>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Получатель</h3>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="text-gray text-sm">Название</label>
            <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>{payment.recipient.name}</p>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="text-gray text-sm">Счет</label>
            <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>{payment.recipient.account}</p>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="text-gray text-sm">БИК</label>
            <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>{payment.recipient.bic}</p>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="text-gray text-sm">Банк</label>
            <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>{payment.recipient.bank}</p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Плательщик</h3>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="text-gray text-sm">Название</label>
            <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>{payment.payer.name}</p>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="text-gray text-sm">Счет</label>
            <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>{payment.payer.account}</p>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Назначение платежа</h3>
          <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{payment.purpose}</p>
        </div>

        {payment.status === 'created' && (
          <div className="card" style={{ borderColor: 'var(--warning)' }}>
            {!showSignForm ? (
              <button onClick={() => setShowSignForm(true)} className="btn btn-primary btn-block">
                ✍️ Подписать платеж
              </button>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSign(); }}>
                <div className="form-group">
                  <label>Код подтверждения (2FA)</label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="hint-text">Введите 6-значный код из SMS</p>
                </div>

                <div className="flex" style={{ gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary flex-1">
                    Подписать
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignForm(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="card" style={{ background: 'var(--gray-100)' }}>
          <h4 style={{ margin: '0 0 0.75rem 0' }}>История</h4>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              ✅ Создан: {format(new Date(payment.createdAt), 'dd.MM.yyyy HH:mm')}
            </div>
            {payment.signedAt && (
              <div style={{ marginBottom: '0.5rem' }}>
                ✍️ Подписан: {format(new Date(payment.signedAt), 'dd.MM.yyyy HH:mm')}
              </div>
            )}
            {payment.sentAt && (
              <div style={{ marginBottom: '0.5rem' }}>
                📤 Отправлен: {format(new Date(payment.sentAt), 'dd.MM.yyyy HH:mm')}
              </div>
            )}
            {payment.executedAt && (
              <div>
                ✅ Исполнен: {format(new Date(payment.executedAt), 'dd.MM.yyyy HH:mm')}
              </div>
            )}
          </div>
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
