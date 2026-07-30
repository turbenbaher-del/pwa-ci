import { useEffect, useMemo, useState } from 'react'
import { usePaymentsStore } from '../store/payments'
import { useAccountsStore } from '../store/accounts'
import { formatCurrency } from '../utils/format'
import '../styles/pages.css'

const PERIODS: { key: string; label: string; months: number | null }[] = [
  { key: '1m', label: 'Месяц', months: 1 },
  { key: '3m', label: '3 мес', months: 3 },
  { key: '6m', label: '6 мес', months: 6 },
  { key: '12m', label: 'Год', months: 12 },
  { key: 'all', label: 'Всё', months: null },
]

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const monthLabel = (key: string) => {
  const [y, m] = key.split('-')
  return `${MONTHS[parseInt(m) - 1]} ${y.slice(2)}`
}

// Аналитика оборотов (перенос из T financial-analytics): доход/расход, динамика, топ-контрагенты.
export function AnalyticsPage() {
  const { payments, fetchPayments } = usePaymentsStore()
  const { accounts, fetchAccounts } = useAccountsStore()

  const [period, setPeriod] = useState('6m')
  const [account, setAccount] = useState('all')

  useEffect(() => {
    if (payments.length === 0) fetchPayments()
    if (accounts.length === 0) fetchAccounts()
  }, [])

  // Счета, по которым реально есть операции (чтобы не показывать пустые в фильтре)
  const accountsWithOps = useMemo(() => {
    const s = new Set<string>()
    payments.forEach(p => { if (p.account) s.add(p.account) })
    return s
  }, [payments])

  const filtered = useMemo(() => {
    const months = PERIODS.find(x => x.key === period)?.months ?? null
    let cutoff: number | null = null
    if (months != null) {
      const d = new Date(); d.setMonth(d.getMonth() - months); cutoff = d.getTime()
    }
    return payments.filter(p => {
      const t = (p.date instanceof Date ? p.date : new Date(p.date)).getTime()
      if (cutoff != null && t < cutoff) return false
      if (account !== 'all' && p.account !== account) return false
      return true
    })
  }, [payments, period, account])

  const a = useMemo(() => {
    let income = 0, expense = 0
    const byMonth: Record<string, { income: number; expense: number }> = {}
    const byParty: Record<string, { total: number; count: number }> = {}

    for (const p of filtered) {
      const amt = p.amount || 0
      if (amt >= 0) income += amt
      else expense += -amt

      const d = p.date instanceof Date ? p.date : new Date(p.date)
      const mk = monthKey(d)
      byMonth[mk] ??= { income: 0, expense: 0 }
      if (amt >= 0) byMonth[mk].income += amt
      else byMonth[mk].expense += -amt

      if (amt < 0) {
        const name = p.recipient?.name?.trim() || '—'
        byParty[name] ??= { total: 0, count: 0 }
        byParty[name].total += -amt
        byParty[name].count += 1
      }
    }

    const months = Object.keys(byMonth).sort().slice(-8)
    const maxMonth = Math.max(1, ...months.map(m => Math.max(byMonth[m].income, byMonth[m].expense)))
    const topParties = Object.entries(byParty)
      .map(([name, v]) => ({ name, ...v }))
      .sort((x, y) => y.total - x.total)
      .slice(0, 6)
    const maxParty = Math.max(1, ...topParties.map(t => t.total))

    return {
      income, expense,
      turnover: income + expense,
      net: income - expense,
      count: filtered.length,
      months, byMonth, maxMonth, topParties, maxParty,
    }
  }, [filtered])

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Аналитика оборотов</h1>
          <p className="page-subtitle">Доходы, расходы и динамика по операциям</p>
        </div>
      </div>

      {/* Filters: period + account */}
      <div className="an-filters">
        <div className="an-segmented">
          {PERIODS.map(pd => (
            <button
              key={pd.key}
              className={`an-seg${period === pd.key ? ' active' : ''}`}
              onClick={() => setPeriod(pd.key)}
            >{pd.label}</button>
          ))}
        </div>
        <select className="an-acc-select" value={account} onChange={e => setAccount(e.target.value)}>
          <option value="all">Все счета</option>
          {accounts.map(acc => (
            <option key={acc.number} value={acc.number} disabled={!accountsWithOps.has(acc.number)}>
              …{acc.number.slice(-4)} · {formatCurrency(acc.balance, acc.currency === 'RUR' ? 'RUB' : acc.currency)}
              {accountsWithOps.has(acc.number) ? '' : ' (нет операций)'}
            </option>
          ))}
        </select>
      </div>

      {/* KPI */}
      <div className="an-kpi-grid">
        <div className="an-kpi">
          <div className="an-kpi-label">Оборот за период</div>
          <div className="an-kpi-value">{formatCurrency(a.turnover)}</div>
          <div className="an-kpi-meta">{a.count} операций</div>
        </div>
        <div className="an-kpi">
          <div className="an-kpi-label">Поступления</div>
          <div className="an-kpi-value pos">{formatCurrency(a.income)}</div>
          <div className="an-kpi-meta">входящие</div>
        </div>
        <div className="an-kpi">
          <div className="an-kpi-label">Списания</div>
          <div className="an-kpi-value neg">{formatCurrency(-a.expense)}</div>
          <div className="an-kpi-meta">исходящие</div>
        </div>
        <div className="an-kpi">
          <div className="an-kpi-label">Чистый поток</div>
          <div className={`an-kpi-value ${a.net >= 0 ? 'pos' : 'neg'}`}>{formatCurrency(a.net)}</div>
          <div className="an-kpi-meta">остаток: {formatCurrency(totalBalance)}</div>
        </div>
      </div>

      {/* Monthly dynamics */}
      <div className="an-card">
        <div className="an-card-title">Динамика по месяцам</div>
        {a.months.length === 0 ? (
          <div className="an-empty">Нет данных за период</div>
        ) : (
          <>
            <div className="an-chart">
              {a.months.map(mk => (
                <div className="an-chart-col" key={mk}>
                  <div className="an-chart-bars">
                    <div className="an-bar in" style={{ height: `${(a.byMonth[mk].income / a.maxMonth) * 100}%` }}
                      title={`Поступления: ${formatCurrency(a.byMonth[mk].income)}`} />
                    <div className="an-bar out" style={{ height: `${(a.byMonth[mk].expense / a.maxMonth) * 100}%` }}
                      title={`Списания: ${formatCurrency(a.byMonth[mk].expense)}`} />
                  </div>
                  <div className="an-chart-x">{monthLabel(mk)}</div>
                </div>
              ))}
            </div>
            <div className="an-legend">
              <span><i className="an-dot in" /> Поступления</span>
              <span><i className="an-dot out" /> Списания</span>
            </div>
          </>
        )}
      </div>

      {/* Top counterparties */}
      <div className="an-card">
        <div className="an-card-title">Топ контрагентов по списаниям</div>
        {a.topParties.length === 0 ? (
          <div className="an-empty">Нет исходящих операций</div>
        ) : (
          <div className="an-parties">
            {a.topParties.map(t => (
              <div className="an-party" key={t.name}>
                <div className="an-party-row">
                  <span className="an-party-name" title={t.name}>{t.name}</span>
                  <span className="an-party-amount">{formatCurrency(t.total)}</span>
                </div>
                <div className="an-party-track">
                  <div className="an-party-fill" style={{ width: `${(t.total / a.maxParty) * 100}%` }} />
                </div>
                <div className="an-party-meta">{t.count} платеж(ей) · {((t.total / (a.expense || 1)) * 100).toFixed(0)}% расходов</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
