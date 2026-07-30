import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch } from '../utils/api'
import { isDemo } from '../utils/demo'
import '../styles/pages.css'

// Разделы ДБО, которые прокси умеет открывать. Порядок — как в меню банка.
export const DBO_SECTIONS: { key: string; title: string; subtitle: string }[] = [
  { key: 'credits',   title: 'Мои кредиты',       subtitle: 'Кредитные продукты организации' },
  { key: 'deposits',  title: 'Мои депозиты',      subtitle: 'Размещённые средства' },
  { key: 'acquiring', title: 'Эквайринг',         subtitle: 'Приём платежей по картам и СБП' },
  { key: 'salary',    title: 'Зарплатный проект', subtitle: 'Выплаты сотрудникам' },
  { key: 'ausn',      title: 'АУСН',              subtitle: 'Автоматизированная упрощённая система налогообложения' },
  { key: 'documents', title: 'Мои документы',     subtitle: 'Документы и справки банка' },
  { key: 'bonus',     title: 'Бонус за партнёра', subtitle: 'Партнёрская программа' },
  { key: 'services',  title: 'Сервисы',           subtitle: 'Дополнительные сервисы банка' },
  { key: 'products',  title: 'Прочие продукты',   subtitle: 'Остальные продукты банка' },
  // Подразделы «Счетов и платежей» из меню ДБО
  { key: 'bulk',       title: 'Массовые платежи', subtitle: 'Реестры и пакетная отправка' },
  { key: 'invoices',   title: 'Счета на оплату',  subtitle: 'Выставленные счета' },
  { key: 'stmtorders', title: 'Запросы выписок',  subtitle: 'Заказанные выписки по счетам' },
]

interface SectionData {
  key: string
  title: string
  navigated: boolean
  fields: { label: string; value: string }[]
  screenText: string
  responses: number
}

export function SectionPage() {
  const { key = '' } = useParams<{ key: string }>()
  const meta = DBO_SECTIONS.find(s => s.key === key)

  const [data, setData] = useState<SectionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!meta) return
    setData(null); setError('')

    if (isDemo()) {
      setError('Раздел показывает данные из ДБО — в демо-режиме они недоступны')
      return
    }

    setLoading(true)
    apiFetch(`/api/sections/${key}`)
      .then(json => setData(json.data ?? json))
      .catch(e => setError(e instanceof Error ? e.message : 'Не удалось загрузить раздел'))
      .finally(() => setLoading(false))
  }, [key, meta])

  if (!meta) {
    return (
      <div className="page">
        <div className="alert alert-danger">Неизвестный раздел</div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{meta.title}</h1>
          <p className="page-subtitle">{meta.subtitle}</p>
        </div>
      </div>

      {loading && (
        <div className="an-empty">
          <span className="spinner" /> Загружаем раздел из ДБО… Это занимает до 30 секунд.
        </div>
      )}

      {error && <div className="alert alert-warning">{error}</div>}

      {data && (
        <>
          {data.fields.length > 0 && (
            <div className="an-card">
              <div className="an-card-title">Данные раздела</div>
              <div className="tx-list">
                {data.fields.map((f, i) => (
                  <div className="tx-item" key={`${f.label}-${i}`}>
                    <div className="tx-info">
                      <div className="tx-desc" style={{ whiteSpace: 'normal' }}>{f.label}</div>
                    </div>
                    <div className="tx-right">
                      <div className="tx-amount" style={{ fontSize: 'var(--text-sm)' }}>{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.fields.length === 0 && (
            <div className="an-card">
              <div className="an-card-title">Раздел открыт, структурных данных банк не отдал</div>
              {data.screenText ? (
                <pre style={{
                  whiteSpace: 'pre-wrap', margin: 0, fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)',
                  maxHeight: 420, overflow: 'auto',
                }}>
                  {data.screenText}
                </pre>
              ) : (
                <div className="an-empty">
                  {data.navigated
                    ? 'Банк не вернул содержимое раздела'
                    : 'Не удалось перейти в раздел — вероятно, он не подключён для вашей организации'}
                </div>
              )}
            </div>
          )}

          <div className="an-party-meta" style={{ marginTop: 12 }}>
            Данные считываются напрямую из веб-ДБО. Если раздел выглядит неполным —
            откройте его в веб-версии банка: структура страницы могла измениться.
          </div>
        </>
      )}
    </div>
  )
}
