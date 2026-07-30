import { Link } from 'react-router-dom'
import { DBO_SECTIONS } from './SectionPage'
import '../styles/pages.css'

// Обзор разделов ДБО, не связанных с платежами: продукты и сервисы банка.
export function ProductsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Продукты и сервисы</h1>
          <p className="page-subtitle">Разделы ДБО вашей организации</p>
        </div>
      </div>

      <div className="quick-actions" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {DBO_SECTIONS.map(s => (
          <Link key={s.key} to={`/sections/${s.key}`} className="quick-action">
            <div className="quick-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <span className="quick-action-label">{s.title}</span>
          </Link>
        ))}
      </div>

      <div className="an-party-meta" style={{ marginTop: 16 }}>
        Разделы открываются напрямую из веб-ДБО, поэтому загрузка занимает до 30 секунд.
        Если раздел не подключён для организации, банк вернёт пустой экран.
      </div>
    </div>
  )
}
