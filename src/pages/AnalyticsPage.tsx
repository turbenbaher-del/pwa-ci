import { usePaymentsStore } from '../store/payments'
import { useAccountsStore } from '../store/accounts'
import { formatCurrency } from '../utils/format'
import '../styles/pages.css'

export function AnalyticsPage() {
  const { payments } = usePaymentsStore()
  const { accounts } = useAccountsStore()

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const avgAmount = payments.length > 0 ? totalPaid / payments.length : 0
  const executed = payments.filter(p => p.status === 'executed').length
  const pending = payments.filter(p => p.status === 'created' || p.status === 'signed').length
  const rejected = payments.filter(p => p.status === 'rejected').length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Аналитика</h1>
          <p className="page-subtitle">Статистика и анализ финансовых операций</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-card-label">Остаток на счетах</div>
          <div className="kpi-card-value">{formatCurrency(totalBalance)}</div>
          <div className="kpi-card-meta">По всем счетам (RUB)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="kpi-card-label">Всего платежей</div>
          <div className="kpi-card-value">{payments.length}</div>
          <div className="kpi-card-meta">За загруженный период</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="kpi-card-label">Исполнено</div>
          <div className="kpi-card-value">{executed}</div>
          <div className="kpi-card-meta">Успешных платежей</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="kpi-card-label">Ожидают</div>
          <div className="kpi-card-value">{pending}</div>
          <div className="kpi-card-meta">На обработке</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Payment stats */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Статус платежей</h2>
          </div>
          <div className="section-body" style={{ padding: '1.25rem 1.5rem' }}>
            {[
              { label: 'Исполнено', count: executed, color: 'var(--color-primary)' },
              { label: 'На подпись', count: pending, color: 'var(--color-warning)' },
              { label: 'Отклонено', count: rejected, color: 'var(--color-error)' },
              { label: 'Всего', count: payments.length, color: 'var(--color-text)' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{label}</span>
                <strong style={{ fontFamily: 'var(--font-primary)', color, fontSize: 'var(--text-sm)' }}>{count}</strong>
              </div>
            ))}

            {payments.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Средний платёж</div>
                <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>
                  {formatCurrency(avgAmount)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Last activity */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Последняя активность</h2>
          </div>
          <div className="section-body" style={{ padding: payments.length === 0 ? 0 : undefined }}>
            {payments.length > 0 ? (
              <div className="tx-list">
                {payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="tx-item">
                    <div className="tx-avatar">{(p.recipient.name || '?').charAt(0).toUpperCase()}</div>
                    <div className="tx-info">
                      <div className="tx-name">{p.recipient.name || '—'}</div>
                      <div className="tx-desc">{p.purpose?.slice(0, 40) ?? ''}</div>
                    </div>
                    <div className="tx-right">
                      <div className="tx-amount">{formatCurrency(p.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">Нет данных</div>
                <p className="empty-state-text">Данные появятся после загрузки платежей</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Рекомендации</h2>
        </div>
        <div className="section-body" style={{ padding: '1.25rem 1.5rem' }}>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              'Регулярно проверяйте статус платежей в разделе «Платежи»',
              'Используйте шаблоны для часто повторяющихся платёжных поручений',
              'Скачивайте выписки для бухгалтерского учёта и аудита',
              'Добавляйте контрагентов для ускорения создания новых платежей',
            ].map((tip) => (
              <li key={tip} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
