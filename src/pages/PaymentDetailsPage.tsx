import { useParams, useNavigate } from 'react-router-dom'
import { usePaymentsStore } from '../store/payments'
import { formatCurrency } from '../utils/format'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { SignModal } from '../components/SignModal'
import { apiFetch, apiFetchBlob } from '../utils/api'
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
  const { getPaymentById, fetchPaymentById, fetchPayments } = usePaymentsStore()
  const [showSignModal, setShowSignModal] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [printing, setPrinting] = useState(false)

  const removeDoc = async () => {
    if (!payment) return
    if (!window.confirm('Удалить черновик? Восстановить его будет нельзя.')) return
    setRemoving(true)
    try {
      const json = await apiFetch('/api/documents/delete', {
        method: 'POST',
        body: JSON.stringify({ ids: [payment.id] }),
      })
      if (json.success === false) throw new Error(json.error || 'Банк не удалил документ')
      navigate('/payments')
    } catch (e) {
      setPrintError(e instanceof Error ? e.message : 'Не удалось удалить')
    } finally {
      setRemoving(false)
    }
  }
  const [printError, setPrintError] = useState('')

  // Файл приходит потоком, а не JSON: открываем его как обычную загрузку
  const printDoc = async () => {
    if (!payment) return
    setPrinting(true); setPrintError('')
    try {
      const { blob, filename } = await apiFetchBlob(
        `/api/documents/${encodeURIComponent(payment.id)}/print?format=PDF`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `Платёжное поручение ${payment.number || ''}.pdf`.trim()
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Ссылку освобождаем не сразу: Safari на iPhone обрывает скачивание,
      // если отозвать её в тот же момент
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (e) {
      setPrintError(e instanceof Error ? e.message : 'Не удалось получить платёжку')
    } finally {
      setPrinting(false)
    }
  }
  const [loading, setLoading] = useState(false)

  const payment = id ? getPaymentById(id) : undefined

  // Прямое открытие ссылки на платёж: стор пуст, догружаем операцию из банка
  useEffect(() => {
    if (!id || payment) return
    setLoading(true)
    fetchPaymentById(id).finally(() => setLoading(false))
  }, [id, payment, fetchPaymentById])

  if (!payment) {
    return (
      <div className="page">
        {loading
          ? <div className="an-empty"><span className="spinner" /> Загружаем платёж…</div>
          : <div className="alert alert-error">Платёж не найден</div>}
      </div>
    )
  }

  // Подписать можно документ, ожидающий подписи: черновик или «на подпись».
  // У документов из ДБО теперь есть идентификатор, поэтому подпись доступна
  // и для них — через окно ввода ключа токена.
  const canSign = payment.status === 'draft' || payment.status === 'created'

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

        {/* Подпись документа, ожидающего подписи */}
        {canSign && (
          <div style={{ ...cardStyle, border: '1px solid rgba(254,114,0,0.3)', background: 'rgba(254,114,0,0.04)' }}>
            <button onClick={() => setShowSignModal(true)} className="btn btn-primary btn-block">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
              </svg>
              Подписать
            </button>
            <p style={{ margin: '0.75rem 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
              Потребуется ключ с токена и подтверждение в PayControl на телефоне —
              как в веб-версии банка.
            </p>
          </div>
        )}

        {/* Удаление доступно только для черновиков: банк всё равно проверит
            и откажет, но незачем показывать кнопку, которая заведомо не сработает */}
        {(payment.status === 'draft' || payment.status === 'created') && (
          <div style={cardStyle}>
            <button onClick={removeDoc} className="btn btn-ghost btn-block" disabled={removing}>
              {removing ? <span className="spinner" /> : null}
              Удалить черновик
            </button>
          </div>
        )}

        {/* Печатная форма с отметкой банка: её просят контрагенты и налоговая,
            и сделать такую самим нельзя — отметку ставит банк */}
        <div style={cardStyle}>
          <button onClick={printDoc} className="btn btn-secondary btn-block" disabled={printing}>
            {printing ? <span className="spinner" /> : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            )}
            Скачать платёжку (PDF)
          </button>
          {printError && (
            <div className="alert alert-danger" style={{ marginTop: '0.75rem' }}>{printError}</div>
          )}
        </div>

        {showSignModal && (
          <SignModal
            payment={payment}
            onClose={() => setShowSignModal(false)}
            onSigned={() => fetchPayments()}
          />
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
  const m: Record<string, string> = { draft: 'Создан', created: 'Частично подписан', signed: 'Подписан', sent: 'Отправлен', executed: 'Исполнен', rejected: 'Отклонён' }
  return m[status] ?? status
}
