import { useEffect, useState } from 'react'
import { useConfirmStore } from '../store/confirm'

// Единый модал подтверждения/подписи. Рендерится один раз в корне (App).
// requireCode=false → простое подтверждение. requireCode=true → фаза «получить код» → «подписать».
export function ConfirmModal() {
  const { open, options, _finish } = useConfirmStore()
  const [phase, setPhase] = useState<'ask' | 'code'>('ask')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  // reset on open/close
  useEffect(() => {
    if (open) { setPhase('ask'); setCode(''); setError(''); setSending(false) }
  }, [open])

  // Esc to cancel
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') _finish({ ok: false }) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, _finish])

  if (!open || !options) return null

  const { title, message, details, confirmLabel, cancelLabel, danger, requireCode } = options

  const requestCode = () => {
    setSending(true); setError('')
    // Демо: «отправка кода». В реале — вызов requestConfirmation на бэке.
    setTimeout(() => { setSending(false); setPhase('code') }, 500)
  }

  const submitCode = () => {
    if (code.replace(/\D/g, '').length !== 6) { setError('Введите 6 цифр из SMS'); return }
    _finish({ ok: true, code })
  }

  const primaryLabel = confirmLabel || (requireCode ? 'Подписать и отправить' : 'Подтвердить')

  return (
    <div className="cm-overlay" onMouseDown={() => _finish({ ok: false })}>
      <div className="cm-card" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="cm-title">{title}</div>
        {message && <div className="cm-message">{message}</div>}

        {details && details.length > 0 && (
          <div className="cm-details">
            {details.map((d, i) => (
              <div className="cm-detail-row" key={i}>
                <span className="cm-detail-label">{d.label}</span>
                <span className="cm-detail-value">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {requireCode && phase === 'code' && (
          <div className="cm-code">
            <label>Код подтверждения из SMS</label>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
              placeholder="______"
              className="cm-code-input"
              onKeyDown={(e) => { if (e.key === 'Enter') submitCode() }}
            />
            <div className="cm-code-hint">Демо-режим: введите любые 6 цифр</div>
          </div>
        )}

        {error && <div className="cm-error">{error}</div>}

        <div className="cm-actions">
          <button type="button" className="btn btn-secondary" onClick={() => _finish({ ok: false })} disabled={sending}>
            {cancelLabel || 'Отмена'}
          </button>

          {requireCode && phase === 'ask' ? (
            <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={requestCode} disabled={sending}>
              {sending ? <span className="spinner" /> : null}
              {sending ? 'Отправка кода…' : 'Получить код'}
            </button>
          ) : (
            <button
              type="button"
              className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => (requireCode ? submitCode() : _finish({ ok: true }))}
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
