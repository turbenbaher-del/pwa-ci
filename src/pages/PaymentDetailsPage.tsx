import { useParams, useNavigate } from 'react-router-dom'
import { usePaymentsStore } from '../store/payments'
import { formatCurrency } from '../utils/format'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useState } from 'react'
import '../styles/pages.css'

const cardStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem 1.5rem',
  marginBottom: '1.25rem',
}

const fieldStyle = { marginBottom: '1rem' }
const fieldLabel = { display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4, fontFamily: 'var(--font-primary)', fontWeight: 500 } as const
const fieldValue = { fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--color-text)' } as const

export function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getPaymentById, signPayment } = usePaymentsStore()
  const [showSignForm, setShowSignForm] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [signMsg, setSignMsg] = useState('')
  const [signing, setSigning] = useState(false)

  const payment = id ? getPaymentById(id) : undefined

  if (!payment) {
    return (
      <div className="page">
        <div className="alert alert-error">Платёж не найден</div>
      </div>
    )
  }

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (twoFactorCode.length !== 6) { setSignMsg('Введите 6-значный код'); return }
    setSigning(true)
    try {
      await signPayment(payment.id, 'signature_placeholder', twoFactorCode)
      setShowSignForm(false)
      setSignMsg('Платёж подписан')
    } catch {
      setSignMsg('Ошибка при подписании')
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Платёж</h1>
          <p className="page-subtitle">Детали платёжного поручения</p>
        </div>
        <button onClick={() => navigate('/payments')} className="btn btn-secondary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Назад
        </button>
      </div>

      <div style={{ maxWidth: 620 }}>
        {/* Status card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Статус платежа</span>
            <span className={`badge badge-${getStatusColor(payment.status)}`}>
              {getStatusLabel(payment.status)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Идентификатор', value: payment.id },
              { label: 'Приоритет', value: payment.priority === 'normal' ? 'Обычный' : 'Срочный' },
              { label: 'Дата платежа', value: format(new Date(payment.date), 'dd MMMM yyyy', { locale: ru }) },
              { label: 'Валюта', value: payment.currency },
            ].map(({ label, value }) => (
              <div key={label} style={fieldStyle}>
                <span style={fieldLabel}>{label}</span>
                <span style={fieldValue}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem' }}>
            <span style={{ fontFamily: 'var(--font-primary)', fontSize: 'var(--text-xs)', color: 'var(--color-primary-dark)', fontWeight: 600 }}>СУММА ПЛАТЕЖА</span>
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text)', marginTop: 4, letterSpacing: '-0.5px' }}>
              {formatCurrency(payment.amount)}
            </div>
          </div>
        </div>

        {/* Recipient */}
        <div style={cardStyle}>
          <div style={{ ...fieldLabel, display: 'block', marginBottom: '1rem', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>Получатель</div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {[
              { label: 'Наименование', value: payment.recipient.name || '—' },
              { label: 'Расчётный счёт', value: payment.recipient.account || '—' },
              { label: 'БИК', value: payment.recipient.bic || '—' },
              { label: 'Банк', value: payment.recipient.bank || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={fieldLabel}>{label}</span>
                <span style={{ ...fieldValue, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payer */}
        <div style={cardStyle}>
          <div style={{ ...fieldLabel, display: 'block', marginBottom: '1rem', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>Плательщик</div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {[
              { label: 'Наименование', value: payment.payer.name || '—' },
              { label: 'Расчётный счёт', value: payment.payer.account || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={fieldLabel}>{label}</span>
                <span style={{ ...fieldValue, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Purpose */}
        {payment.purpose && (
          <div style={cardStyle}>
            <span style={{ ...fieldLabel, display: 'block', marginBottom: '0.625rem' }}>Назначение платежа</span>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>{payment.purpose}</p>
          </div>
        )}

        {/* Sign form */}
        {payment.status === 'created' && (
          <div style={{ ...cardStyle, border: '1px solid rgba(254,114,0,0.3)', background: 'rgba(254,114,0,0.04)' }}>
            {!showSignForm ? (
              <button onClick={() => setShowSignForm(true)} className="btn btn-primary btn-block">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
                </svg>
                Подписать платёж
              </button>
            ) : (
              <form onSubmit={handleSign}>
                {signMsg && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{signMsg}</div>}
                <div className="form-group">
                  <label>Код подтверждения (2FA)</label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    disabled={signing}
                  />
                  <div className="form-hint">Введите 6-значный код из SMS</div>
                </div>
                <div className="flex" style={{ gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary flex-1" disabled={signing}>
                    {signing ? <span className="spinner" /> : null} Подписать
                  </button>
                  <button type="button" onClick={() => setShowSignForm(false)} className="btn btn-secondary flex-1" disabled={signing}>
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Timeline */}
        <div style={cardStyle}>
          <div style={{ ...fieldLabel, display: 'block', marginBottom: '1rem', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>История</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { label: 'Создан', date: payment.createdAt, always: true },
              { label: 'Подписан', date: payment.signedAt, always: false },
              { label: 'Отправлен', date: payment.sentAt, always: false },
              { label: 'Исполнен', date: payment.executedAt, always: false },
            ].filter(e => e.always || e.date).map(({ label, date }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 500 }}>
                  {date ? format(new Date(date), 'dd.MM.yyyy HH:mm') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  const m: Record<string, string> = { draft: 'gray', created: 'info', signed: 'warning', sent: 'info', executed: 'success', rejected: 'error' }
  return m[status] ?? 'gray'
}
function getStatusLabel(status: string) {
  const m: Record<string, string> = { draft: 'Черновик', created: 'Создан', signed: 'Подписан', sent: 'Отправлен', executed: 'Исполнен', rejected: 'Отклонён' }
  return m[status] ?? status
}
