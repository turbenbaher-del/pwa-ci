import { useEffect, useState } from 'react'
import { useAccountsStore } from '../store/accounts'
import { formatCurrency } from '../utils/format'
import '../styles/pages.css'

function formatAccountNumber(num: string): string {
  // Format as XXXXX.XXX.X.XXXXXXXXXXX (20 digits → 5.3.1.11)
  const d = num.replace(/\D/g, '')
  if (d.length === 20) {
    return `${d.slice(0,5)}.${d.slice(5,8)}.${d.slice(8,9)}.${d.slice(9,20)}`
  }
  return num
}

function AccountSkeleton() {
  return (
    <div className="account-card" style={{ padding: '1.25rem 1.5rem' }}>
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 16, width: '60%' }} />
        <div className="skeleton" style={{ height: 12, width: '35%' }} />
      </div>
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <div className="skeleton" style={{ height: 20, width: 120 }} />
        <div className="skeleton" style={{ height: 12, width: 50 }} />
      </div>
    </div>
  )
}

export function AccountsPage() {
  const { accounts, loading, error, fetchAccounts } = useAccountsStore()
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num).catch(() => {})
    setCopied(num)
    setTimeout(() => setCopied(null), 2000)
  }

  const totalRub = accounts
    .filter(a => a.currency === 'RUR' || a.currency === 'RUB')
    .reduce((sum, a) => sum + a.balance, 0)

  const openCount = accounts.filter(a => a.status === 'Открыт' || a.status === 'active').length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Счета</h1>
          <p className="page-subtitle">Все расчётные счета вашей организации</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-card-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-card-label">Итого (RUB)</div>
          <div className="kpi-card-value">
            {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 140, height: 28 }} /> : formatCurrency(totalRub)}
          </div>
          <div className="kpi-card-meta">Суммарный остаток в рублях</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <div className="kpi-card-label">Всего счетов</div>
          <div className="kpi-card-value">{loading ? '—' : accounts.length}</div>
          <div className="kpi-card-meta">Открытых: {loading ? '—' : openCount}</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Accounts list */}
      <div className="accounts-list">
        {loading ? (
          <>
            <AccountSkeleton />
            <AccountSkeleton />
            <AccountSkeleton />
            <AccountSkeleton />
          </>
        ) : accounts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏦</div>
            <div className="empty-state-title">Счета не найдены</div>
            <p className="empty-state-text">Обратитесь в банк для открытия расчётного счёта</p>
          </div>
        ) : (
          accounts.map((acc) => {
            const isOpen = acc.status === 'Открыт' || acc.status === 'active'
            const formatted = formatAccountNumber(acc.number)
            const isCopied = copied === acc.number

            return (
              <div key={acc.number} className="account-card">
                <div className="account-card-icon">
                  {acc.currency}
                </div>

                <div className="account-card-info">
                  <div className="account-card-number">
                    <span>{formatted}</span>
                    <button
                      className="account-card-copy"
                      onClick={() => handleCopy(acc.number)}
                      title="Скопировать номер счёта"
                    >
                      {isCopied ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                    {isCopied && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontFamily: 'var(--font-body)' }}>
                        скопировано
                      </span>
                    )}
                  </div>
                  <div className="account-card-meta">
                    Расчётный счёт · {acc.currency}
                  </div>
                </div>

                <div className="account-card-right">
                  <div className="account-card-balance">
                    {formatCurrency(acc.balance, acc.currency === 'RUR' ? 'RUB' : acc.currency)}
                  </div>
                  <div className="account-card-currency" style={{ marginTop: 6 }}>
                    <span
                      className={`badge ${isOpen ? 'badge-success' : 'badge-neutral'}`}
                      style={{ fontSize: '0.6rem' }}
                    >
                      {acc.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
