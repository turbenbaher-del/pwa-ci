import { useEffect, useState } from 'react'
import { apiFetch, friendlyError } from '../utils/api'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import '../styles/pages.css'

interface MailItem {
  id: string
  date: string
  subject: string
  preview: string
  read: boolean
  hasAttaches: boolean
  from: string
  status: string
}

interface MailFull extends MailItem {
  text: string
  attaches: { id: string; name: string; size: number }[]
}

type Box = 'in' | 'out'

export function MailPage() {
  const [box, setBox] = useState<Box>('in')
  const [items, setItems] = useState<MailItem[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [full, setFull] = useState<MailFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = (which: Box) => {
    setLoading(true); setError(''); setOpenId(null); setFull(null)
    apiFetch(`/api/mail?box=${which}&limit=50`)
      .then(res => setItems(res.data?.items ?? []))
      .catch(e => setError(friendlyError(e, 'Не удалось загрузить письма')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(box) }, [box])

  // Раскрытие письма: подтягиваем полный текст и отмечаем прочитанным в банке,
  // иначе счётчик непрочитанных в ДБО не сойдётся с тем, что человек видит.
  const open = async (item: MailItem) => {
    if (openId === item.id) { setOpenId(null); setFull(null); return }
    setOpenId(item.id); setFull(null)
    try {
      const res = await apiFetch(`/api/mail/${encodeURIComponent(item.id)}?box=${box}`)
      setFull(res.data)
      if (!item.read && box === 'in') {
        apiFetch(`/api/mail/${encodeURIComponent(item.id)}/read?box=${box}`, {
          method: 'POST', body: JSON.stringify({ read: true }),
        }).then(() => {
          setItems(list => list.map(m => m.id === item.id ? { ...m, read: true } : m))
        }).catch(() => {})
      }
    } catch (e) {
      setError(friendlyError(e, 'Не удалось открыть письмо'))
    }
  }

  const unread = items.filter(m => !m.read).length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Письма</h1>
          <p className="page-subtitle">
            Переписка с банком{box === 'in' && unread > 0 ? ` · непрочитанных: ${unread}` : ''}
          </p>
        </div>
      </div>

      {/* Те же вкладки-чипы, что в платежах: один визуальный язык */}
      <div className="filter-chips" style={{ marginBottom: '1rem' }}>
        <button
          className={`filter-chip ${box === 'in' ? 'active' : ''}`}
          onClick={() => setBox('in')}
        >
          Входящие
          {unread > 0 && <span className="filter-chip-count">{unread}</span>}
        </button>
        <button
          className={`filter-chip ${box === 'out' ? 'active' : ''}`}
          onClick={() => setBox('out')}
        >
          Исходящие
        </button>
      </div>

      {loading && <div className="an-empty"><span className="spinner" /> Загружаем письма…</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="an-empty">
          {box === 'in' ? 'Входящих писем нет' : 'Исходящих писем нет'}
        </div>
      )}

      {items.length > 0 && (
        <div className="tx-list">
          {items.map(m => (
            <div key={m.id}>
              <div
                className="tx-item"
                style={{ cursor: 'pointer' }}
                onClick={() => open(m)}
              >
                <div className="tx-info">
                  <div
                    className="tx-desc"
                    style={{ whiteSpace: 'normal', fontWeight: m.read ? 400 : 600 }}
                  >
                    {/* Непрочитанное должно быть заметно с первого взгляда */}
                    {!m.read && box === 'in' && (
                      <span style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--color-primary)', marginRight: 8, verticalAlign: 'middle',
                      }} />
                    )}
                    {m.subject}
                    {m.hasAttaches && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round"
                        style={{ display: 'inline-block', marginLeft: 6, verticalAlign: 'middle', opacity: 0.6 }}>
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    )}
                  </div>
                  {m.from && <div className="tx-date">{m.from}</div>}
                  <div className="tx-date">
                    {m.date ? format(new Date(m.date), 'd MMM yyyy', { locale: ru }) : ''}
                    {m.status ? ` · ${m.status}` : ''}
                  </div>
                </div>
              </div>

              {openId === m.id && (
                <div className="an-card" style={{ margin: '0 0 0.75rem' }}>
                  {!full && <div className="an-empty"><span className="spinner" /> Открываем…</div>}
                  {full && (
                    <>
                      <pre style={{
                        whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.55,
                      }}>
                        {full.text || 'Текст письма пуст'}
                      </pre>
                      {full.attaches?.length > 0 && (
                        <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--color-border-light)' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                            Вложения
                          </div>
                          {full.attaches.map(a => (
                            <div key={a.id} style={{ fontSize: 'var(--text-sm)' }}>{a.name}</div>
                          ))}
                          <div className="form-hint" style={{ marginTop: 6 }}>
                            Скачивание вложений пока не подключено — откройте письмо в веб-версии ДБО
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
