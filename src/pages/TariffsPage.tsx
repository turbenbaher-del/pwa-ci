import { useEffect, useMemo, useState } from 'react'
import { usePaymentsStore } from '../store/payments'
import { useAccountsStore } from '../store/accounts'
import { formatCurrency } from '../utils/format'
import { apiFetch } from '../utils/api'
import { isDemo } from '../utils/demo'
import '../styles/pages.css'

interface Tariff { label: string; value: string }

// Прозрачные тарифы/лимиты (перенос из T): комиссии по типам операций
// + реальное использование за месяц из платежей.
const COMMISSIONS = [
  { type: 'Внутри банка (Центр-инвест)', value: 'без комиссии', note: 'переводы между счетами ЦИ', kind: 'free' },
  { type: 'Межбанковский платёж (платёжка)', value: '≈ 0,1% · 25–150 ₽', note: 'исходящий рублёвый перевод', kind: 'paid' },
  { type: 'СБП B2B', value: 'по тарифу', note: 'переводы между юрлицами через СБП', kind: 'paid' },
  { type: 'Валютный перевод / ВЭД', value: 'по тарифу', note: 'исходящий валютный платёж', kind: 'paid' },
]

// Ориентиры лимитов тарифа (устанавливаются банком; здесь — референс для наглядности).
const REFERENCE = {
  monthTurnover: 5_000_000, // ₽ / мес — ориентир
  monthCount: 100,          // платежей / мес — ориентир
}

export function TariffsPage() {
  const { payments, fetchPayments } = usePaymentsStore()
  const { accounts, fetchAccounts } = useAccountsStore()

  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [tariffsLoading, setTariffsLoading] = useState(false)

  useEffect(() => {
    if (payments.length === 0) fetchPayments()
    if (accounts.length === 0) fetchAccounts()
    if (!isDemo()) {
      setTariffsLoading(true)
      apiFetch('/api/tariffs')
        .then(r => {
          const list: Tariff[] = (r.data ?? r ?? []).filter((t: Tariff) => t.label && t.value)
          // dedupe by normalized label
          const seen = new Set<string>(); const out: Tariff[] = []
          for (const t of list) {
            const key = t.label.replace(/\s+/g, ' ').trim().toLowerCase()
            if (seen.has(key)) continue
            seen.add(key); out.push({ label: t.label.replace(/\s+/g, ' ').trim(), value: t.value })
          }
          setTariffs(out)
        })
        .catch(() => setTariffs([]))
        .finally(() => setTariffsLoading(false))
    }
  }, [])

  const usage = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth()
    const out = payments.filter(p => {
      const d = p.date instanceof Date ? p.date : new Date(p.date)
      return (p.amount || 0) < 0 && d.getFullYear() === y && d.getMonth() === m
    })
    const sum = out.reduce((s, p) => s + Math.abs(p.amount || 0), 0)
    return { sum, count: out.length, avg: out.length ? sum / out.length : 0 }
  }, [payments])

  const pct = (v: number, max: number) => Math.min(100, (v / max) * 100)
  const totalAvailable = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Тарифы и лимиты</h1>
          <p className="page-subtitle">Комиссии за операции и использование за месяц</p>
        </div>
      </div>

      {/* Commissions — real bank tariffs (fallback to defaults) */}
      <div className="an-card">
        <div className="an-card-title">
          Тарифы банка{tariffs.length > 0 ? '' : ' (ориентир)'}
          {tariffsLoading && <span className="tr-loading"> · загрузка…</span>}
        </div>
        {tariffs.length > 0 ? (
          <div className="tr-comm">
            {tariffs.map(t => {
              const free = /беспл/i.test(t.value)
              return (
                <div className="tr-tariff" key={t.label}>
                  <div className="tr-tariff-label">{t.label}</div>
                  <div className={`tr-tariff-value${free ? ' free' : ''}`}>{t.value}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="tr-comm">
            {COMMISSIONS.map(c => (
              <div className="tr-comm-row" key={c.type}>
                <div className="tr-comm-main">
                  <span className="tr-comm-type">{c.type}</span>
                  <span className="tr-comm-note">{c.note}</span>
                </div>
                <span className={`tr-comm-val ${c.kind === 'free' ? 'free' : ''}`}>{c.value}</span>
              </div>
            ))}
          </div>
        )}
        <div className="an-party-meta" style={{ marginTop: 12 }}>
          {tariffs.length > 0
            ? 'Действующие тарифы вашего РКО (из банка). Комиссия рассчитывается при подписании.'
            : 'Ориентир по комиссиям; фактические тарифы загружаются из банка.'}
        </div>
      </div>

      {/* Limits / usage this month (real) */}
      <div className="an-card">
        <div className="an-card-title">Использование за текущий месяц</div>
        <div className="tr-limit">
          <div className="tr-limit-row">
            <span className="tr-limit-label">Оборот по исходящим</span>
            <span className="tr-limit-num">{formatCurrency(usage.sum)} <i>/ {formatCurrency(REFERENCE.monthTurnover)}</i></span>
          </div>
          <div className="an-party-track"><div className="an-party-fill" style={{ width: `${pct(usage.sum, REFERENCE.monthTurnover)}%` }} /></div>
        </div>
        <div className="tr-limit">
          <div className="tr-limit-row">
            <span className="tr-limit-label">Платежей за месяц</span>
            <span className="tr-limit-num">{usage.count} <i>/ {REFERENCE.monthCount}</i></span>
          </div>
          <div className="an-party-track"><div className="an-party-fill" style={{ width: `${pct(usage.count, REFERENCE.monthCount)}%` }} /></div>
        </div>
        <div className="tr-stats">
          <div className="tr-stat"><div className="tr-stat-label">Средний платёж</div><div className="tr-stat-val">{formatCurrency(usage.avg)}</div></div>
          <div className="tr-stat"><div className="tr-stat-label">Доступно по счетам</div><div className="tr-stat-val">{formatCurrency(totalAvailable)}</div></div>
        </div>
        <div className="an-party-meta" style={{ marginTop: 12 }}>
          Использование — по вашим реальным операциям. Лимиты (правая цифра) — ориентир тарифа; фактические устанавливаются банком.
        </div>
      </div>

      {/* Available per account (real) */}
      <div className="an-card">
        <div className="an-card-title">Доступно по счетам</div>
        {accounts.length === 0 ? (
          <div className="an-empty">Нет данных по счетам</div>
        ) : (
          <div className="tr-accs">
            {accounts.map(acc => (
              <div className="tr-acc" key={acc.number}>
                <span className="tr-acc-num">…{acc.number.slice(-4)}</span>
                <span className="tr-acc-bal">{formatCurrency(acc.balance, acc.currency === 'RUR' ? 'RUB' : acc.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
