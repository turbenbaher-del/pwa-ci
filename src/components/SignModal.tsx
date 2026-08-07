import { useState, useRef, useEffect } from 'react'
import { apiFetch, friendlyError } from '../utils/api'
import { formatCurrency } from '../utils/format'
import type { Payment } from '../store/payments'

interface SignModalProps {
  payment: Payment
  onClose: () => void
  onSigned: () => void
}

// Порядок шагов повторяет сценарий банка (useSignAndSend в его фронте):
//   intro → подтверждение в PayControl → ключ с токена → подпись и отправка.
// Подтверждающая подпись идёт ПЕРВОЙ: банк выдаёт по ней confirmTransactionId,
// без которого основная подпись ключом не принимается.
type Stage =
  | 'intro'          // сводка документа, кнопка «Продолжить»
  | 'starting'       // запрашиваем у банка средства подписи
  | 'payControl'     // ждём подтверждения в приложении на телефоне
  | 'needKey'        // банк готов принять ключ с токена
  | 'submitting'     // проверяем ключ и отправляем документ
  | 'done'           // подписан и отправлен в банк
  | 'signedNotSent'  // подписан, но отправка не прошла
  | 'error'

export function SignModal({ payment, onClose, onSigned }: SignModalProps) {
  const [stage, setStage] = useState<Stage>('intro')
  const [serial, setSerial] = useState('')
  const [attempts, setAttempts] = useState<number | undefined>()
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const pollTimer = useRef<number | undefined>(undefined)

  const amount = formatCurrency(Math.abs(payment.amount), payment.currency)
  const docPath = `/api/documents/${encodeURIComponent(payment.id)}`

  // Опрос прекращаем при закрытии окна, иначе он продолжит стучать в банк
  useEffect(() => () => { if (pollTimer.current) window.clearTimeout(pollTimer.current) }, [])

  // Ответ банка одинаков у start и status — обрабатываем в одном месте
  const applyStage = (data: any) => {
    if (data.stage === 'needKey') {
      setSerial(data.serial || '')
      setAttempts(data.attempts)
      setStage('needKey')
      return
    }
    if (data.stage === 'confirm') {
      setMessage(data.message || 'Подтвердите операцию в приложении PayControl')
      setStage('payControl')
      schedulePoll()
      return
    }
    setError((data.errors || []).join('; ') || 'Банк не начал подпись')
    setStage('error')
  }

  const schedulePoll = () => {
    pollTimer.current = window.setTimeout(pollStatus, 3000)
  }

  const pollStatus = async () => {
    try {
      const { data } = await apiFetch(`${docPath}/sign/status`)
      applyStage(data)
    } catch {
      // Разрыв связи не должен ронять подпись — пробуем ещё раз
      schedulePoll()
    }
  }

  const start = async () => {
    setStage('starting'); setError('')
    try {
      const { data } = await apiFetch(`${docPath}/sign/start`, { method: 'POST' })
      applyStage(data)
    } catch (e) {
      setError(friendlyError(e, 'Не удалось начать подпись'))
      setStage('error')
    }
  }

  const submitKey = async () => {
    if (!key.trim()) { setError('Введите ключ с токена'); return }
    setStage('submitting'); setError('')
    try {
      const { data } = await apiFetch(`${docPath}/sign/key`, {
        method: 'POST',
        body: JSON.stringify({ key: key.trim() }),
      })
      if (data.stage === 'done') {
        setMessage(data.message || 'Документ подписан и отправлен в банк')
        setStage('done')
        onSigned()
      } else if (data.stage === 'signed') {
        setMessage(data.message || 'Документ подписан, но отправка не прошла')
        setStage('signedNotSent')
        onSigned()
      } else if (data.stage === 'confirm') {
        // Ключ приняли — это была подтверждающая подпись. Теперь основная:
        // банк ждёт подтверждения в приложении PayControl на телефоне.
        setKey('')
        setMessage(data.message || 'Подтвердите операцию в приложении PayControl')
        setStage('payControl')
        schedulePoll()
      } else {
        setError((data.errors || []).join('; ') || 'Ключ не принят')
        setKey('')
        setStage('needKey')
      }
    } catch (e) {
      setError(friendlyError(e, 'Ошибка при отправке ключа'))
      setStage('needKey')
    }
  }

  const closable = stage === 'intro' || stage === 'error' || stage === 'done' || stage === 'signedNotSent'

  return (
    <div className="sign-overlay" onClick={closable ? onClose : undefined}>
      <div className="sign-modal" onClick={e => e.stopPropagation()}>
        <div className="sign-modal-head">
          <span className="sign-modal-title">Подпись платежа</span>
          {closable && (
            <button className="sign-modal-close" onClick={onClose} aria-label="Закрыть">×</button>
          )}
        </div>

        {/* Сводка документа — видна на всех шагах */}
        <div className="sign-summary">
          <div className="sign-summary-amount">{amount}</div>
          <div className="sign-summary-line">{payment.recipient?.name || 'Получатель не указан'}</div>
          {payment.purpose && <div className="sign-summary-purpose">{payment.purpose}</div>}
        </div>

        {stage === 'intro' && (
          <>
            <div className="sign-note">
              Платёж будет подписан и отправлен в банк. Потребуется подтверждение
              в приложении PayControl и ключ с вашего токена.
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

        {stage === 'payControl' && (
          <div className="sign-status sign-paycontrol">
            <div className="sign-phone-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
              </svg>
            </div>
            {message}
            <div className="form-hint" style={{ marginTop: '0.5rem' }}>
              Как подтвердите — здесь откроется ввод ключа с токена
            </div>
            <button className="btn btn-ghost btn-block" style={{ marginTop: '1rem' }} onClick={onClose}>Отмена</button>
          </div>
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
              <div className="form-hint">
                Нажмите кнопку на токене и введите показанный код
                {attempts ? `. Попыток до блокировки: ${attempts}` : ''}
              </div>
            </div>
            {error && <div className="alert alert-danger" style={{ marginBottom: '0.75rem' }}>{error}</div>}
            <div className="sign-actions">
              <button className="btn btn-primary btn-block" onClick={submitKey}>Подписать и отправить</button>
              <button className="btn btn-ghost btn-block" onClick={onClose}>Отмена</button>
            </div>
          </>
        )}

        {stage === 'submitting' && (
          <div className="sign-status"><span className="spinner" /> Подписываем и отправляем в банк…</div>
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

        {/* Подпись прошла, а отправка нет — документ остался в банке неотправленным.
            Молчать об этом нельзя: человек будет думать, что деньги ушли. */}
        {stage === 'signedNotSent' && (
          <>
            <div className="alert alert-danger">{message}</div>
            <div className="sign-note">
              Документ подписан и лежит в банке. Отправьте его повторно из списка
              платежей или в веб-версии ДБО.
            </div>
            <div className="sign-actions">
              <button className="btn btn-primary btn-block" onClick={onClose}>Закрыть</button>
            </div>
          </>
        )}

        {stage === 'error' && (
          <>
            <div className="alert alert-danger">{error}</div>
            <div className="sign-actions">
              <button className="btn btn-secondary btn-block" onClick={() => setStage('intro')}>Назад</button>
              <button className="btn btn-ghost btn-block" onClick={onClose}>Закрыть</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
