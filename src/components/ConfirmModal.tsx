import { useEffect } from 'react'
import { useConfirmStore } from '../store/confirm'

// Единый модал подтверждения. Рендерится один раз в корне (App).
// Раньше здесь была фаза «получить код из SMS» — в ДБО Центр-инвеста подпись
// идёт ключом с токена и подтверждением в PayControl, а не по SMS, поэтому
// фейковый ввод кода убран. Осталось простое подтверждение да/нет.
export function ConfirmModal() {
  const { open, options, _finish } = useConfirmStore()

  // Esc отменяет
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') _finish({ ok: false }) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, _finish])

  if (!open || !options) return null

  const { title, message, details, confirmLabel, cancelLabel, danger } = options
  const primaryLabel = confirmLabel || 'Подтвердить'

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

        <div className="cm-actions">
          <button type="button" className="btn btn-secondary" onClick={() => _finish({ ok: false })}>
            {cancelLabel || 'Отмена'}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => _finish({ ok: true })}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
