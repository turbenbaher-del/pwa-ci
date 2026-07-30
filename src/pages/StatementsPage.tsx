import { useState, useEffect, useMemo } from 'react'
import { useAccountsStore } from '../store/accounts'
import { usePaymentsStore } from '../store/payments'
import { apiFetchBlob } from '../utils/api'
import { formatCurrency } from '../utils/format'
import '../styles/pages.css'

const firstOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0] }
const today = () => new Date().toISOString().split('T')[0]

export function StatementsPage() {
  const { accounts, fetchAccounts } = useAccountsStore()
  const { payments, fetchPayments } = usePaymentsStore()
  const [account, setAccount] = useState('')
  const [dateFrom, setDateFrom] = useState(firstOfMonth())
  const [dateTo, setDateTo] = useState(today())
  const [fmt, setFmt] = useState('pdf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (accounts.length === 0) fetchAccounts()
    if (payments.length === 0) fetchPayments()
  }, [])

  // Реальные операции за период по счёту (из выписки)
  const ops = useMemo(() => {
    const from = new Date(dateFrom + 'T00:00:00').getTime()
    const to = new Date(dateTo + 'T23:59:59').getTime()
    return payments
      .filter(p => {
        const t = (p.date instanceof Date ? p.date : new Date(p.date)).getTime()
        if (t < from || t > to) return false
        if (account && p.account !== account) return false
        return true
      })
      .sort((a, b) => (b.date instanceof Date ? b.date : new Date(b.date)).getTime() - (a.date instanceof Date ? a.date : new Date(a.date)).getTime())
  }, [payments, account, dateFrom, dateTo])

  const totals = useMemo(() => {
    let inc = 0, exp = 0
    for (const p of ops) { if ((p.amount || 0) >= 0) inc += p.amount; else exp += -p.amount }
    return { inc, exp, count: ops.length }
  }, [ops])

  const fmtDate = (d: Date | string) => {
    const dt = d instanceof Date ? d : new Date(d)
    return dt.toLocaleDateString('ru-RU')
  }

  const exportCsv = () => {
    const rows = [['Дата', 'Документ', 'Контрагент', 'Назначение', 'Сумма', 'Валюта', 'Направление']]
    for (const p of ops) {
      rows.push([
        fmtDate(p.date), String((p as any).number ?? p.id ?? ''),
        p.recipient?.name ?? '', (p.purpose ?? '').replace(/[\r\n;]/g, ' '),
        String(p.amount ?? 0).replace('.', ','), p.currency ?? 'RUB',
        (p.amount || 0) >= 0 ? 'поступление' : 'списание',
      ])
    }
    const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `выписка_${dateFrom}_${dateTo}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadBankFile = async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ dateFrom, dateTo, format: fmt })
      if (account) params.set('account', account)
      const { blob, filename: bankName } = await apiFetchBlob(`/api/statement?${params}`)
      const ext = fmt === '1c' ? 'txt' : fmt
      const filename = bankName || `выписка_${dateFrom}_${dateTo}.${ext}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при скачивании файла банка')
    } finally { setLoading(false) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Выписка</h1>
          <p className="page-subtitle">Операции по счёту за период</p>
        </div>
      </div>

      {/* Filters */}
      <div className="st-filters">
        <select className="an-acc-select" value={account} onChange={e => setAccount(e.target.value)}>
          <option value="">Все счета</option>
          {accounts.map(a => (
            <option key={a.number} value={a.number}>…{a.number.slice(-4)} · {a.currency === 'RUR' ? 'RUB' : a.currency}</option>
          ))}
        </select>
        <input type="date" className="an-acc-select" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="an-acc-select" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className="btn btn-ghost" onClick={exportCsv} disabled={ops.length === 0}>Экспорт CSV</button>
      </div>

      {/* Period totals */}
      <div className="an-kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="an-kpi"><div className="an-kpi-label">Операций</div><div className="an-kpi-value">{totals.count}</div></div>
        <div className="an-kpi"><div className="an-kpi-label">Поступления</div><div className="an-kpi-value pos">{formatCurrency(totals.inc)}</div></div>
        <div className="an-kpi"><div className="an-kpi-label">Списания</div><div className="an-kpi-value neg">{formatCurrency(-totals.exp)}</div></div>
      </div>

      {/* Operations */}
      <div className="an-card">
        <div className="an-card-title">Операции за период</div>
        {ops.length === 0 ? (
          <div className="an-empty">Нет операций за выбранный период</div>
        ) : (
          <div className="st-ops">
            {ops.map((p, i) => (
              <div className="st-op" key={p.id + '-' + i}>
                <div className="st-op-date">{fmtDate(p.date)}</div>
                <div className="st-op-main">
                  <div className="st-op-name">{p.recipient?.name || '—'}</div>
                  <div className="st-op-desc">{(p.purpose || '').slice(0, 70)}</div>
                </div>
                <div className={`st-op-amt ${(p.amount || 0) >= 0 ? 'pos' : 'neg'}`}>
                  {(p.amount || 0) >= 0 ? '+' : ''}{formatCurrency(p.amount || 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official bank file */}
      <div className="an-card">
        <div className="an-card-title">Официальный файл выписки (из банка)</div>
        <div className="st-filters" style={{ marginBottom: 12 }}>
          <select className="an-acc-select" value={fmt} onChange={e => setFmt(e.target.value)}>
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel (XLSX)</option>
            <option value="csv">CSV</option>
            <option value="1c">1С</option>
          </select>
          <button className="btn btn-primary" onClick={downloadBankFile} disabled={loading}>
            {loading ? <span className="spinner" /> : null}{loading ? 'Формирование…' : 'Скачать файл банка'}
          </button>
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom: 0 }}>{error}</div>}
        <div className="an-party-meta">
          Файл формируется банком (до ~30 c). Для больших периодов банк может ограничивать построение — тогда сузьте даты.
          CSV выше формируется мгновенно из операций.
        </div>
      </div>
    </div>
  )
}
