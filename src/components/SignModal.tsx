import { useState } from 'react'
import { apiFetch, friendlyError } from '../utils/api'
import { formatCurrency } from '../utils/format'
import type { Payment } from '../store/payments'

interface SignModalProps {
  payment: Payment
  onClose: () => void
  onSigned: () => void
}

type Stage = 'confirm' | 'starting' | 'needKey' | 'submitting' | 'waitingPayControl' | 'done' | 'error'

// Окно подписи документа. Повторяет двухфакторный процесс банка:
// ключ с аппаратного токена eToken + подтверждение в PayControl на телефоне.
// Оба фактора — только у владельца, приложение лишь ведёт по шагам.
export function SignModal({ payment, onClose, onSigned }: SignModalProps) {
  const [stage, setStage] = useState<Stage>('confirm')
  const [serial, setSerial] = useState('')
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const amount = formatCurrency(Math.abs(payment.amount), payment.currency)

  // Шаг 1: отправить документ на подпись, получить серийник токена
  const start = async () => {
    setStage('starting'); setError('')
    try {
      const { data } = await apiFetch(`/api/documents/${encodeURIComponent(payment.id)}/sign/start`, {
        method: 'POST',
      })
      setSerial(data.serial || '')
      setStage('needKey')
    } catch (e) {
      setError(friendlyError(e, 'Не удалось начать подпись'))
      setStage('error')
    }
  }

  // Шаг 2: отправить ключ с токена, дальше — подтверждение в PayControl
  const submitKey = async () => {
    if (!key.trim()) { setError('Введите ключ с токена'); return }
    setStage('submitting'); setError('')
    try {
      const { data } = await apiFetch(`/api/documents/${encodeURIComponent(payment.id)}/sign/key`, {
        method: 'POST',
        body: JSON.stringify({ key: key.trim() }),
      })
      if (data.stage === 'done') {
        setMessage(data.message || 'Документ подписан')
        setStage('done')
        onSigned()
      } else if (data.stage === 'waitingPayControl') {
        setMessage(data.message || 'Подтвердите операцию в приложении PayControl')
        setStage('waitingPayControl')
      } else {
        setError((data.errors || []).join('; ') || 'Ключ не принят')
        setStage('needKey')
      }
    } catch (e) {
      setError(friendlyError(e, 'Ошибка при отправке ключа'))
      setStage('needKey')
    }
  }

  return (
    <div className="sign-overlay" onClick={stage === 'confirm' ? onClose : undefined}>
      <div className="sign-modal" onClick={e => e.stopPropagation()}>
        <div className="sign-modal-head">
          <span className="sign-modal-title">Подпись платежа</span>
          {(stage === 'confirm' || stage === 'error' || stage === 'done') && (
            <button className="sign-modal-close" onClick={onClose} aria-label="Закрыть">×</button>
          )}
        </div>

        {/* Сводка документа — видна на всех шагах */}
        <div className="sign-summary">
          <div className="sign-summary-amount">{amount}</div>
          <div className="sign-summary-line">{payment.recipient?.name || 'Получатель не указан'}</div>
          {payment.purpose && <div className="sign-summary-purpose">{payment.purpose}</div>}
        </div>

        {stage === 'confirm' && (
          <>
            <div className="sign-note">
              Платёж будет отправлен в банк. Подтверждение — ключом с вашего токена
              и в приложении PayControl на телефоне.
            </div>
            <div className="sign-actions">
              <button className="btn btn-primary btn-block" onClick={start}>Продолжить</button>
              <button className="btn btn-ghost btn-block" onClick={onClose}>Отмена</button>
            </div>
          </>
        )}

        {stage === 'starting' && (
          <div className="sign-status"><span className="spinner" /> Отправляем документ на подпись…</div>
        )}

        {stage === 'needKey' && (
          <>
            {serial && (
              <div className="sign-field">
                <label>Серийный номер токена</label>
                <div className="sign-serial">{serial}</div>
              </div>
            )}
            <div className="sign-field">
              <label>Ключ с токена eToken PASS</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={key}
                onChange={e => setKey(e.target.value.replace(/\s/g, ''))}
                placeholder="Код с устройства"
                autoFocus
              />
              <div className="form-hint">Нажмите кнопку на токене и введите показанный код</div>
            </div>
            {error && <div className="alert alert-danger" style={{ marginBottom: '0.75rem' }}>{error}</div>}
            <div className="sign-actions">
              <button className="btn btn-primary btn-block" onClick={submitKey}>Подписать</button>
              <button className="btn btn-ghost btn-block" onClick={onClose}>Отмена</button>
            </div>
          </>
        )}

        {stage === 'submitting' && (
          <div className="sign-status"><span className="spinner" /> Проверяем ключ…</div>
        )}

        {stage === 'waitingPayControl' && (
          <div className="sign-status sign-paycontrol">
            <div className="sign-phone-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
              </svg>
            </div>
            {message}
            <div className="form-hint" style={{ marginTop: '0.5rem' }}>Окно можно закрыть — статус обновится в списке платежей</div>
            <button className="btn btn-secondary btn-block" style={{ marginTop: '1rem' }} onClick={() => { onSigned(); onClose() }}>Готово</button>
          </div>
        )}

        {stage === 'done' && (
          <div className="sign-status sign-done">
            <div className="sign-check">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            {message}
            <button className="btn btn-primary btn-block" style={{ marginTop: '1rem' }} onClick={onClose}>Закрыть</button>
          </div>
        )}

        {stage === 'error' && (
          <>
            <div className="alert alert-danger">{error}</div>
            <div className="sign-actions">
              <button className="btn btn-secondary btn-block" onClick={() => setStage('confirm')}>Назад</button>
              <button className="btn btn-ghost btn-block" onClick={onClose}>Закрыть</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
